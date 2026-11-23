"""Shared index/commit checks and reporting; no duplicated gate implementation."""
from .cli import run
from project_hds import validate
from .evidence import validate_prior_removals
from .continuity_history import validate_base

def check_view(repo, view, paths, base):
    engineering = run(view, paths)
    validate_prior_removals(repo, view, paths, base, engineering['errors'])
    validate_base(repo, view, paths, base, engineering['errors'])
    engineering['success'] = not engineering['errors']
    documents = validate(view,base,git_root=repo,affected=paths)
    return {'success':engineering['success'] and documents['success'],
            'errors':engineering['errors'] + documents['errors'],
            'checked_source_files':engineering.get('checked_source_files',0)}

def report(label, result):
    for error in result['errors']:print('ERROR: '+error)
    print(label + (' PASSED' if result['success'] else ' FAILED'))
    return 0 if result['success'] else 1
