#!/usr/bin/env python3
"""Explicit checkpoint recorder; never invent facts, run checks or stage files."""
import argparse
from pathlib import Path
from engineering_quality.checkpoint import record
from engineering_quality.change_scope import selected, snapshot
from hds_validation.common import load_yaml

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--scope', choices=('working','staged'), default='working')
    args = parser.parse_args()
    root = args.root.resolve()
    request = load_yaml(args.input.read_text())
    if args.scope == 'staged':
        with snapshot(root,staged=True) as view:
            result = record(root,request,selected(root,view,staged=True),source_view=view)
    else:
        result = record(root,request,selected(root,root))
    print(f'CHECKPOINT RECORDED: {result["checkpoint_id"]}; sequence {result["sequence"]}.')
    print('No files were staged. Inspect generated state, run checks, then stage evidence and checkpoint together.')

if __name__ == '__main__':
    main()
