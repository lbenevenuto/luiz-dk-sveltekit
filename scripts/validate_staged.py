#!/usr/bin/env python3
"""Commit gate: validate indexed bytes, not the editable working directory."""
from pathlib import Path
import sys
from engineering_quality.change_scope import snapshot, selected, has_head
from engineering_quality.change_validation import check_view, report
from engineering_quality.legacy import audit

def main():
    repo = Path(__file__).resolve().parent.parent
    audit(repo)  # Records findings without staging them or changing index bytes.
    with snapshot(repo, staged=True) as view:
        paths = selected(repo, view, staged=True)
        result = check_view(repo,view,paths,'HEAD' if has_head(repo) else None)
        return report('STAGED COMMIT VALIDATION',result)

if __name__ == '__main__':
    try:raise SystemExit(main())
    except (ValueError, OSError) as exc:
        print('STAGED COMMIT VALIDATION FAILED: ' + str(exc))
        raise SystemExit(1)
