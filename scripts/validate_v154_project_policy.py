#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
errors = []
texts = []
for rel in ['.agentic-harness/project-policy.yml', '.agentic-harness/validation-policy.yml']:
    p = ROOT / rel
    if not p.exists():
        errors.append(f'Missing v1.6.1 project policy file: {rel}')
    else:
        texts.append(p.read_text(encoding='utf-8'))
combined = '\n'.join(texts)
for token in ['human_decision_gate', 'fixture', 'payload', 'needs_review']:
    if token not in combined:
        errors.append(f'Project policies missing v1.5.7 policy token: {token}')
if errors:
    print('V1.6.1 PROJECT POLICY VALIDATION FAILED')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)
print('V1.6.1 PROJECT POLICY VALIDATION PASSED')
