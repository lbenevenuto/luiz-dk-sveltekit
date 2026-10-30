#!/usr/bin/env python3
"""Read persisted work state and reconcile the real repository, without writes."""
import argparse
import json
from pathlib import Path
from engineering_quality.recovery import inspect

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--json',action='store_true')
    args = parser.parse_args()
    report = inspect(args.root.resolve())
    if args.json:print(json.dumps(report,ensure_ascii=False,indent=2))
    else:
        print('RESUME READY' if report['success'] else 'RESUME RECONCILIATION REQUIRED')
        for key in ('checkpoint_id','phase','outcome','current_task','next_action','resume_checks','git_status'):
            if key in report:print(f'{key}: {report[key]}')
        for error in report['errors']:print('ERROR: '+error)
        for key in ('tasks','decisions','historical_decisions','blockers','questions','validation'):
            print(key+': '+json.dumps(report.get(key,[]),ensure_ascii=False,indent=2))
        print('Read next: '+', '.join(report.get('read_next',[])))
    return 0 if report['success'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
