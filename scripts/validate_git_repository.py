#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
if not (ROOT / '.git').exists():
    print('GIT VALIDATION FAILED: .git directory missing')
    sys.exit(1)
result = subprocess.run(['git', 'status', '--short'], cwd=ROOT, text=True, capture_output=True)
if result.returncode != 0:
    print('GIT VALIDATION FAILED: git status failed')
    sys.exit(1)
print('GIT REPOSITORY VALIDATION PASSED')
