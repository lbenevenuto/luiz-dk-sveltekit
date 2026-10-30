"""hDS consumer adapter: preserve untouched adopted documents."""
from pathlib import Path
import argparse
import json
from hds_gate import run
from engineering_quality.legacy import unchanged

def validate(root, base=None, git_root=None, affected=None):
    legacy = {rel for rel in unchanged(root) if rel.endswith('.md') and (affected is None or rel not in affected)}
    return run(root, base, legacy_documents=legacy, git_root=git_root)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--base-ref')
    parser.add_argument('--json', action='store_true')
    args = parser.parse_args()
    try:
        from engineering_quality.change_scope import selected
        root = args.root.resolve()
        result = validate(root, args.base_ref, affected=selected(root,root,base=args.base_ref))
    except (ValueError,OSError) as exc:result={'success':False,'errors':[str(exc)],'warnings':[]}
    if args.json:print(json.dumps(result,ensure_ascii=False,indent=2))
    else:
        for error in result['errors']:print('ERROR: '+error)
        print('HDS VALIDATION PASSED' if result['success'] else 'HDS VALIDATION FAILED')
    return 0 if result['success'] else 1
