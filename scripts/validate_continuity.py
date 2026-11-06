#!/usr/bin/env python3
"""Read-only working-tree continuity gate."""
from pathlib import Path
from engineering_quality.change_scope import selected
from engineering_quality.continuity import validate

def main():
    root = Path(__file__).resolve().parents[1]
    errors = []
    validate(root,errors,selected(root,root))
    for error in errors:print('ERROR: '+error)
    print('CONTINUITY FAILED' if errors else 'CONTINUITY PASSED')
    return 1 if errors else 0

if __name__ == '__main__':
    raise SystemExit(main())
