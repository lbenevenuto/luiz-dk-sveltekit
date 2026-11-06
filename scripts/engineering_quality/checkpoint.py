"""Explicitly save supplied facts; never stage files or infer success."""
from datetime import datetime, timezone
from pathlib import Path
import copy
import json
import re
import os
import tempfile
import yaml
from .continuity import CONFIG, HEAD, HISTORY, state_paths, config, facts, protected
from .continuity_history import head, check_chain, pending_tasks
from .sources import digest
from .evidence import local
from hds_validation.common import load_yaml, parse_doc

def initialize_config(root, role):
    path = root / CONFIG
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(yaml.safe_dump(dict(schema_version='1.0.0', role=role,
            state_files=state_paths(role)), sort_keys=False))
    return config(root)

def task_lines(data, statuses=None):
    return '\n'.join(f'- {t["task_id"]} [{t["status"]}]: {t["title"]}\n  Acceptance: {t["acceptance"]}\n  Remaining: {t["remaining_work"]}'
        for t in data['tasks'] if statuses is None or t['status'] in statuses) or 'No tasks in this category; consult the explicit task inventory in the active checkpoint.'

def records(data, category):
    return '\n'.join(f'- {r["id"]}: {r["summary"]}\n  Reason: {r["reason"]}\n  Evidence: '+', '.join(r.get('evidence', []))
                    + (f'\n  Status: {r["status"]}' if 'status' in r else '') for r in data[category]) or data['no_'+category+'_reason']

def render(kind, data):
    common = (f'# Agent {kind.title()}\n\n## Active checkpoint\n\n'
        f'Checkpoint: {data["checkpoint_id"]}. Phase: {data["phase"]}. Outcome: {data["outcome"]}. '
        f'Current task: {data["current_task"]}. Recorded by: {data["actor"]}.\n\n{data["summary"]}\n\n')
    if kind == 'STATE':
        body = '## Task inventory\n\n'+task_lines(data)
    elif kind == 'PROGRESS':
        body = '## Completed work\n\n'+task_lines(data, {'done'})+'\n\n## In progress and pending\n\n'+task_lines(data, {'pending','in_progress','blocked'})
    elif kind == 'TODO':
        body = '## Pending work and acceptance criteria\n\n'+task_lines(data, {'pending','in_progress','blocked'})
    elif kind == 'DECISIONS':
        body = '## Decisions and rationale\n\n'+records(data, 'decisions')
    elif kind == 'BLOCKERS':
        body = '## Blockers\n\n'+records(data, 'blockers')+'\n\n## Questions and assumptions awaiting evidence\n\n'+records(data, 'questions')
    elif kind == 'VALIDATION':
        body = '## Actual validation status\n\n'+'\n'.join(f'- {c["status"]}: `{json.dumps(c["command"])}`; exit code: {c.get("exit_code")}.\n  {c["result"]}\n  Artifact: {c.get("artifact", "not executed")}' for c in data['validation'])
    else:
        body = ('## Where work stopped\n\n'+task_lines(data)+'\n\n## Next action\n\n'+data['next_action']
            +'\n\n## Reconciliation before resuming\n\n'+data['resume_checks']
            +'\n\n## First files to read\n\n'+'\n'.join('- `'+p+'`' for p in data['read_next'])
            +'\n\nRead the project briefing and PROJECT_BRIEF.md when present. Consult raw briefing policy; do not infer missing requirements or approval from a recorded checkpoint. Read 00-NEXT_AGENT_STARTUP.md in a capsule.\n')
    return common + body + '\n\n## Continuity contract\n\nThe active structured record and immutable archived states live in .agentic-harness/checkpoints/. Run `python3 scripts/resume_project.py` and inspect actual Git status before continuing. A checkpoint preserves saved facts only; it does not capture unsaved conversations or certify decision truth. Preserve untouched legacy findings in .agentic-harness/legacy-findings.yml and repair the complete files changed by this unit.\n'

def state_document(root, rel, kind, data):
    path = root / rel
    if path.exists():
        try:meta, _ = parse_doc(path.read_text())
        except ValueError:meta = {}
    else:meta = {}
    version = str(meta.get('version', '0.0.0')).split('.')
    if len(version) != 3 or not all(v.isdigit() for v in version):
        raise ValueError('existing state document needs valid SemVer')
    version[2] = str(int(version[2])+1)
    identity = meta.get('doc_id') or 'OS-'+re.sub('[^A-Z0-9]+','-',rel.upper()).strip('-')
    meta.update(doc_id=identity, title='Agent '+kind.title(), version='.'.join(version),
        status='review', owner=meta.get('owner','project-owner'), lang=meta.get('lang','en'),
        audience='tech', last_updated=data['recorded_at'][:10], tags=['agentic-os','continuity'],
        document_type='record', pair_required=False, checkpoint_id=data['checkpoint_id'],
        phase=data['phase'], outcome=data['outcome'])
    return '---\n'+yaml.safe_dump(meta,sort_keys=False,allow_unicode=True)+'---\n\n'+render(kind,data), meta

def collect_artifacts(data):
    result = set(data['read_next'])
    for task in data['tasks']:
        result.update(task.get('evidence', []))
    for category in ('decisions','blockers','questions'):
        for item in data[category]:result.update(item.get('evidence', []))
    for check in data['validation']:
        if check['status'] != 'not_run':result.add(check['artifact'])
    return result

def record(root, request, affected, role='capsule', source_view=None):
    """Write an explicit checkpoint after inspection, without running stated checks."""
    cfg = initialize_config(root, role)
    previous = None
    if (root / HEAD).exists():
        previous_data = head(root); check_chain(root, previous_data, require_pending=False)
        previous = load_yaml((root / HEAD).read_text())
        sequence = previous_data['sequence'] + 1
    else:sequence = 1
    data = copy.deepcopy(request)
    present = {task['task_id'] for task in data.get('tasks', [])}
    carried = {key:task for key,task in pending_tasks(root).items() if key not in present}
    data.setdefault('tasks', []).extend(copy.deepcopy(list(carried.values())))
    data['carried_tasks'] = sorted(carried)
    data.setdefault('recorded_at', datetime.now(timezone.utc).isoformat())
    facts(root, data)
    for path in (root / HISTORY).glob('*.yml'):
        if load_yaml(path.read_text())['checkpoint_id'] == data['checkpoint_id']:
            raise ValueError('checkpoint identifiers cannot be reused')
    directory = HISTORY + f'{sequence:08d}/'
    rel = HISTORY + f'{sequence:08d}.yml'
    if (root / rel).exists() or (root / directory).exists():
        raise ValueError('checkpoint destination exists; inspect interrupted recording before retrying')
    data.update(schema_version='1.0.0', sequence=sequence,
        previous=None if previous is None else dict(path=previous['head'], sha256=previous['sha256']),
        configuration_hash=digest(root / CONFIG), state_hashes={}, state_snapshots={}, artifacts={})
    # Prepare complete replacements and a recovery draft before touching active files.
    with tempfile.TemporaryDirectory(prefix='checkpoint-', dir=root / '.agentic-harness') as temp:
        prepared = Path(temp); documents = {}
        for kind, path in cfg['state_files'].items():
            content, meta = state_document(root, path, kind, data)
            target = prepared / Path(path).name; target.write_text(content)
            documents[path] = (target, meta)
        archive = root / directory; archive.mkdir(parents=True)
        (archive / 'request.bin').write_text(yaml.safe_dump(request,sort_keys=False,allow_unicode=True))
        data['request_snapshot'] = dict(snapshot=directory+'request.bin',sha256=digest(archive/'request.bin'))
        data['prior_states'] = {}
        for path in documents:
            if (root / path).exists():
                saved = directory + 'prior-' + Path(path).name + '.txt'
                (root / saved).write_bytes(local(root,path).read_bytes())
                data['prior_states'][path] = dict(snapshot=saved,sha256=digest(root/saved))
        revisions_path = root / 'docs/evidence/revision-register.yml'
        revisions = load_yaml(revisions_path.read_text())
        for path, (prepared_path, meta) in documents.items():
            target = root / path; target.parent.mkdir(parents=True,exist_ok=True)
            os.replace(prepared_path, target)
            saved = directory + Path(path).name + '.txt'
            (root / saved).write_bytes(target.read_bytes())
            checksum = digest(target); data['state_hashes'][path] = checksum
            data['state_snapshots'][path] = dict(snapshot=saved,sha256=checksum)
            revisions['revisions'].append(dict(doc_id=meta['doc_id'],version=meta['version'],date=meta['last_updated'],
                author=data['actor'],change='Explicit continuity checkpoint '+data['checkpoint_id'],action='updated'))
        revisions_path.write_text(yaml.safe_dump(revisions,sort_keys=False,allow_unicode=True))
        for index, path in enumerate(sorted(collect_artifacts(data))):
            source = local(root, path)
            saved = directory + f'evidence-{index:04d}.bin'
            (root / saved).write_bytes(source.read_bytes())
            data['artifacts'][path] = dict(snapshot=saved,sha256=digest(source))
        scope = set(affected) | set(cfg['state_files'].values()) | {'docs/evidence/revision-register.yml'}
        def observed(path):
            view = root if source_view is None or path == 'docs/evidence/revision-register.yml' else source_view
            return digest(local(view,path)) if (view/path).exists() else None
        data['changes'] = {path:observed(path)
            for path in sorted(scope) if not protected(path) and path not in cfg['state_files'].values()}
        encoded = yaml.safe_dump(data,sort_keys=False,allow_unicode=True)
        with (root / rel).open('x') as stream:stream.write(encoded)
        pointer = dict(schema_version='1.0.0',head=rel,sha256=digest(root / rel))
        pending = prepared / 'head.yml';pending.write_text(yaml.safe_dump(pointer,sort_keys=False))
        os.replace(pending, root / HEAD)
    return data
