"""Immutable checkpoint chain, archived state and base-ref enforcement."""
from .continuity import HEAD, HISTORY, CONFIG, protected
from .evidence import local
from .sources import digest
from hds_validation.common import load_yaml
import yaml

def head(root):
    pointer = load_yaml(local(root, HEAD).read_text())
    if pointer.get('schema_version') != '1.0.0':
        raise ValueError('invalid continuity head schema')
    rel = pointer['head']
    if not rel.startswith(HISTORY) or not rel.endswith('.yml'):
        raise ValueError('checkpoint head must reference the local immutable history')
    path = local(root, rel)
    if digest(path) != pointer.get('sha256'):
        raise ValueError('checkpoint head hash mismatch')
    return load_yaml(path.read_text())

def pending_tasks(root):
    """Keep the last explicit status; omission never closes an unfinished task."""
    pending = {}
    for path in sorted((root / HISTORY).glob('*.yml')):
        for task in load_yaml(path.read_text()).get('tasks', []):
            if task['status'] in {'pending','in_progress','blocked'}:
                pending[task['task_id']] = task
            else:pending.pop(task['task_id'],None)
    return pending

def decision_history(root):
    records = []
    for path in sorted((root / HISTORY).glob('*.yml')):
        data = load_yaml(path.read_text())
        for item in data.get('decisions', []):
            entry = dict(checkpoint_id=data['checkpoint_id'],recorded_at=data['recorded_at'],decision=item)
            if not any(record['decision'] == item for record in records):records.append(entry)
    return records

def check_chain(root, latest, require_pending=True):
    files = sorted((root / HISTORY).glob('*.yml'))
    previous = None
    identifiers = set()
    for sequence, path in enumerate(files, 1):
        if path.name != f'{sequence:08d}.yml':
            raise ValueError('checkpoint history has a gap or unexpected filename')
        data = load_yaml(path.read_text())
        if data.get('schema_version') != '1.0.0' or data.get('sequence') != sequence:
            raise ValueError('invalid checkpoint sequence/schema')
        if data.get('checkpoint_id') in identifiers:
            raise ValueError('checkpoint identifiers cannot be reused')
        identifiers.add(data.get('checkpoint_id'))
        expected = None if previous is None else dict(path=previous.relative_to(root).as_posix(), sha256=digest(previous))
        if data.get('previous') != expected:
            raise ValueError('checkpoint history hash chain is broken')
        for rel, item in data.get('state_snapshots', {}).items():
            snapshot = item['snapshot']
            if not snapshot.startswith(HISTORY + f'{sequence:08d}/') or digest(local(root, snapshot)) != item['sha256']:
                raise ValueError(f'{rel}: archived checkpoint state changed')
            if item['sha256'] != data['state_hashes'][rel]:
                raise ValueError('archived and current-state hashes disagree')
        if set(data.get('state_snapshots', {})) != set(data.get('state_hashes', {})):
            raise ValueError('checkpoint must archive every canonical state file')
        for rel, item in list(data.get('artifacts', {}).items()) + list(data.get('prior_states', {}).items()):
            snapshot = item['snapshot']
            if not snapshot.startswith(HISTORY + f'{sequence:08d}/') or digest(local(root, snapshot)) != item['sha256']:
                raise ValueError(f'{rel}: archived checkpoint evidence changed')
        request = data['request_snapshot']
        if not request['snapshot'].startswith(HISTORY + f'{sequence:08d}/') or digest(local(root, request['snapshot'])) != request['sha256']:
            raise ValueError('archived checkpoint request changed')
        previous = path
    if not files or latest != load_yaml(files[-1].read_text()):
        raise ValueError('active checkpoint must be the newest history entry')
    if require_pending and not set(pending_tasks(root)) <= {task['task_id'] for task in latest.get('tasks', [])}:
        raise ValueError('unfinished tasks disappeared from the active checkpoint')

def validate_base(repo, view, affected, base, errors):
    if not base:
        return
    from .change_scope import git
    try:
        names = git(repo, 'ls-tree', '-r', '--name-only', base, '--', HISTORY, CONFIG, HEAD).splitlines()
        for rel in names:
            if rel == HEAD:
                continue
            previous = git(repo, 'show', base + ':' + rel, binary=True)
            if local(view, rel).read_bytes() != previous:
                raise ValueError(f'{rel}: checkpoint history/configuration is immutable')
        previous_pointer = git(repo, 'show', base + ':' + HEAD, check=False)
        if previous_pointer:
            pointer = load_yaml(previous_pointer)
            latest = head(view)
            old = load_yaml(git(repo, 'show', base + ':' + pointer['head']))
            meaningful = any(not protected(p) for p in affected)
            if meaningful and latest['sequence'] <= old['sequence']:
                raise ValueError('project change requires a newer continuity checkpoint')
    except (OSError, ValueError, KeyError, TypeError, AttributeError, yaml.YAMLError) as exc:
        errors.append(f'continuity: {exc}')
