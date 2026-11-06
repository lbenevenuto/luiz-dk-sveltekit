"""Continuity facts and exact-snapshot consistency, never conversation capture."""
from datetime import datetime, timezone
import re
import yaml
from .evidence import text, local, command
from .sources import digest
from hds_validation.common import load_yaml, parse_doc, resolve_local

CONFIG = '.agentic-harness/continuity-config.yml'
HEAD = '.agentic-harness/continuity.yml'
HISTORY = '.agentic-harness/checkpoints/'
KINDS = ('STATE', 'PROGRESS', 'TODO', 'DECISIONS', 'BLOCKERS', 'VALIDATION', 'HANDOFF')
OUTCOMES = {'in_progress', 'completed', 'blocked', 'interrupted'}
TASK_STATUSES = {'pending', 'in_progress', 'done', 'blocked', 'cancelled'}

def state_paths(role):
    prefix = '.agentic-harness/state/' if role == 'standard' else ''
    return {kind: prefix + f'AGENT_{kind}.md' for kind in KINDS}

def config(root):
    data = load_yaml(local(root, CONFIG).read_text())
    if data.get('schema_version') != '1.0.0' or data.get('role') not in {'standard', 'capsule'}:
        raise ValueError('invalid continuity configuration')
    if data.get('state_files') != state_paths(data['role']):
        raise ValueError('canonical state paths cannot be substituted')
    return data

def identifier(value, label):
    if not isinstance(value, str) or not re.fullmatch('[A-Za-z0-9][A-Za-z0-9_.-]{1,79}', value):
        raise ValueError(f'{label}: stable identifier required')

def references(root, values, label):
    if not isinstance(values, list) or not values:
        raise ValueError(f'{label}: local evidence references required')
    for value in values:
        local(root, value)

def facts(root, data):
    identifier(data.get('checkpoint_id'), 'checkpoint')
    text(data.get('actor'), 'checkpoint actor')
    text(data.get('summary'), 'checkpoint summary')
    identifier(data.get('phase'), 'phase')
    if data.get('outcome') not in OUTCOMES:
        raise ValueError('explicit work outcome required')
    stamp = datetime.fromisoformat(data['recorded_at'])
    if stamp.tzinfo is None or stamp > datetime.now(timezone.utc):
        raise ValueError('checkpoint needs actual timezone-aware time, not future time')
    tasks = data.get('tasks')
    if not isinstance(tasks, list) or not tasks:
        raise ValueError('explicit task inventory required')
    ids = set()
    for task in tasks:
        identifier(task.get('task_id'), 'task')
        if task['task_id'] in ids or task.get('status') not in TASK_STATUSES:
            raise ValueError('duplicate task or invalid task status')
        ids.add(task['task_id'])
        for field in ('title', 'acceptance', 'remaining_work'):
            text(task.get(field), 'task ' + field)
        if task['status'] == 'done':
            references(root, task.get('evidence'), 'completed task')
        if task['status'] == 'cancelled':
            text(task.get('cancellation_reason'), 'task cancellation authority/reason')
            references(root,task.get('evidence'),'cancelled task')
    if data.get('current_task') not in ids:
        raise ValueError('current task must exist in the task inventory')
    for category in ('decisions', 'blockers', 'questions'):
        records = data.get(category)
        if not isinstance(records, list):
            raise ValueError(f'{category}: explicit list required')
        seen = set()
        for record in records:
            identifier(record.get('id'), category)
            if record['id'] in seen:
                raise ValueError(f'{category}: duplicate identifier')
            seen.add(record['id'])
            text(record.get('summary'), category + ' summary')
            text(record.get('reason'), category + ' reason')
            if category == 'decisions':
                references(root, record.get('evidence'), 'decision')
            else:
                if record.get('status') not in {'open', 'resolved'}:
                    raise ValueError(f'{category}: open/resolved status required')
                if record['status'] == 'resolved':
                    references(root, record.get('evidence'), category + ' resolution')
            if category == 'blockers' and record.get('task_id') not in ids:
                raise ValueError('blocker must identify an existing task')
        if not records:
            text(data.get('no_' + category + '_reason'), category + ' non-applicability')
    open_blocks = {b['task_id'] for b in data['blockers'] if b['status'] == 'open'}
    if any(t['status'] == 'blocked' and t['task_id'] not in open_blocks for t in tasks):
        raise ValueError('blocked task needs an open blocker')
    checks = data.get('validation')
    if not isinstance(checks, list) or not checks:
        raise ValueError('explicit validation status required, including not-run checks')
    for check in checks:
        command(check.get('command'), 'checkpoint validation')
        text(check.get('result'), 'checkpoint validation result')
        if check.get('status') not in {'passed', 'failed', 'not_run'}:
            raise ValueError('checkpoint check status must be passed/failed/not_run')
        if check['status'] == 'not_run':
            if check.get('exit_code') is not None:
                raise ValueError('unexecuted check cannot have an exit code')
        else:
            if type(check.get('exit_code')) is not int or (check['exit_code'] == 0) != (check['status'] == 'passed'):
                raise ValueError('check status contradicts exit code')
            references(root, [check.get('artifact')], 'executed checkpoint check')
    if data['outcome'] == 'completed':
        if any(t['status'] not in {'done', 'cancelled'} for t in tasks) or open_blocks or any(q['status'] == 'open' for q in data['questions']):
            raise ValueError('completed work cannot have pending tasks, blockers or questions')
        if any(c['status'] != 'passed' for c in checks):
            raise ValueError('completed work needs successful executed validations')
    if data['outcome'] == 'blocked' and not open_blocks:
        raise ValueError('blocked outcome needs an open blocker')
    text(data.get('next_action'), 'next action')
    text(data.get('resume_checks'), 'resume reconciliation instructions')
    references(root, data.get('read_next'), 'next-agent reading order')

def protected(rel):
    return rel in {HEAD, CONFIG, 'PACKAGE_MANIFEST.json'} or rel.startswith(HISTORY)

def validate(root, errors, affected=None):
    try:
        cfg = config(root)
        from .continuity_history import head, check_chain
        data = head(root)
        facts(root, data)
        check_chain(root, data)
        if data.get('configuration_hash') != digest(local(root, CONFIG)):
            raise ValueError('continuity configuration changed without a checkpoint')
        for kind, rel in cfg['state_files'].items():
            path = local(root, rel)
            if data.get('state_hashes', {}).get(rel) != digest(path):
                raise ValueError(f'{rel}: state changed without a fresh checkpoint')
            meta, body = parse_doc(path.read_text())
            for field in ('checkpoint_id', 'phase', 'outcome'):
                if meta.get(field) != data[field]:
                    raise ValueError(f'{rel}: state checkpoint/phase/outcome mismatch')
            if '# ' not in body or len(body.split()) < 40:
                raise ValueError(f'{kind}: meaningful human-readable state required')
        for rel, entry in data.get('artifacts', {}).items():
            if digest(local(root, rel)) != entry['sha256']:
                raise ValueError(f'{rel}: stale checkpoint evidence')
        changes = data.get('changes')
        if not isinstance(changes, dict):
            raise ValueError('checkpoint changed-file inventory required')
        for rel, checksum in changes.items():
            if protected(rel):
                raise ValueError('checkpoint cannot exempt its own history as project changes')
            path = resolve_local(root,rel)
            actual = digest(local(root, rel)) if path.exists() else None
            if actual != checksum:
                raise ValueError(f'{rel}: changed bytes do not match active checkpoint')
        for rel in affected or ():
            if not protected(rel) and rel not in cfg['state_files'].values() and rel not in changes:
                raise ValueError(f'{rel}: change missing from active continuity checkpoint')
        startup = 'START_HERE_FOR_AGENTS.md' if cfg['role'] == 'standard' else '00-NEXT_AGENT_STARTUP.md'
        for rel in ('AGENTS.md', startup):
            if 'resume_project.py' not in local(root, rel).read_text():
                raise ValueError(f'{rel}: checkpoint-based startup instruction missing')
    except (OSError, ValueError, KeyError, TypeError, AttributeError, yaml.YAMLError) as exc:
        errors.append(f'continuity: {exc}')
