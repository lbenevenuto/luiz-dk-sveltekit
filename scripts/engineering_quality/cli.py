"""Fail closed for structure, duplication and documentation coverage."""
from pathlib import Path
import argparse
import json
from .sources import inventory
from .structure import validate as structure
from .duplication import validate as duplication
from .python_clones import validate as python_clones
from .coverage import validate as coverage
from .stack import validate as stack
from .policies import validate as policies
from .continuity import validate as continuity

def run(root, affected=None, size_only=False):
    errors, warnings = [], []
    paths = inventory(root, errors)
    checked = paths if affected is None else [p for p in paths if p.relative_to(root).as_posix() in affected]
    structure(root, checked, errors, warnings)
    if not size_only:
        policies(root, errors)
        duplication(root, paths, errors, affected=affected)
        python_clones(root, paths, errors, affected=affected)
        coverage(root, checked, errors, affected=affected)
        if not errors:stack(root, checked, errors)
        continuity(root, errors, affected)
    return {'success':not errors, 'errors':errors, 'warnings':warnings,
            'source_files':len(paths), 'checked_source_files':len(checked),
            'scope':'all' if affected is None else 'changed', 'semantic_quality_automatically_proven':False}

def main(size_only=False):
    from .change_scope import selected
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--json', action='store_true')
    parser.add_argument('--base-ref')
    parser.add_argument('--all', action='store_true', help='Full audit; legacy violations also fail.')
    args = parser.parse_args()
    root = args.root.resolve()
    try:result = run(root, selected(root,root,base=args.base_ref,all_files=args.all), size_only)
    except (ValueError,OSError) as exc:result={'success':False,'errors':[str(exc)],'warnings':[]}
    if args.json:print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        for item in result['warnings']:print('WARNING: ' + item)
        for item in result['errors']:print('ERROR: ' + item)
        print('ENGINEERING QUALITY PASSED' if result['success'] else 'ENGINEERING QUALITY FAILED')
    return 0 if result['success'] else 1
