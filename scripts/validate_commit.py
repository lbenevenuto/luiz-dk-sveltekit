#!/usr/bin/env python3
"""Push/CI gate validates committed bytes against the supplied base."""
from pathlib import Path
import argparse
from engineering_quality.change_scope import snapshot, selected, git
from engineering_quality.legacy import BASELINE
from engineering_quality.change_validation import check_view, report

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base-ref')
    parser.add_argument('--target-ref', default='HEAD')
    args = parser.parse_args()
    repo = Path(__file__).resolve().parent.parent
    base = args.base_ref
    if not base:
        adoption = git(repo,'log',args.target_ref,'--diff-filter=A','--format=%H','--',BASELINE).splitlines()
        if adoption and adoption[-1] != git(repo,'rev-parse',args.target_ref).strip():base=adoption[-1]
    with snapshot(repo, target=args.target_ref) as view:
        if base:paths=selected(repo,view,base=base,target=args.target_ref)
        else:
            from engineering_quality.legacy import unchanged
            paths={p.relative_to(view).as_posix() for p in view.rglob('*') if p.is_file()} - unchanged(view)
        result=check_view(repo,view,paths,base)
        return report('COMMIT VALIDATION',result)

if __name__ == '__main__':
    try:raise SystemExit(main())
    except (ValueError,OSError) as exc:
        print('COMMIT VALIDATION FAILED: ' + str(exc))
        raise SystemExit(1)
