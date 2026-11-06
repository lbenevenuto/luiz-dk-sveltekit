#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
errors = []
standard = ROOT / 'VISUAL_REFERENCE_HUMAN_PARITY_STANDARD.md'
tooling = ROOT / 'tooling' / 'visual-review'
if not standard.exists():
    errors.append('Missing VISUAL_REFERENCE_HUMAN_PARITY_STANDARD.md')
else:
    text = standard.read_text(encoding='utf-8')
    for token in ['standard_version: 1.0.0', 'AUTOMATED VISUAL COMPARISON = evidence / triage', 'HUMAN VISUAL ACCEPTANCE = final visual parity authority', 'Parity is not Taste']:
        if token not in text:
            errors.append(f'Visual parity standard missing required token: {token}')
for rel in ['README.md', 'VERSION', 'src/index.mjs', 'schemas/run.schema.json', 'schemas/review.schema.json']:
    if not (tooling / rel).exists():
        errors.append(f'Visual Review tooling missing required artifact: tooling/visual-review/{rel}')
manifest = ROOT / '.agentic-harness' / 'manifest.yml'
manifest_text = manifest.read_text(encoding='utf-8') if manifest.exists() else ''
for token in ['visual_review_standard_version: 1.0.0', 'visual_review_harness_version: 0.1.0']:
    if token not in manifest_text:
        errors.append(f'Capsule manifest missing Visual Review metadata: {token}')
policy = ROOT / '.agentic-harness' / 'project-policy.yml'
policy_text = policy.read_text(encoding='utf-8') if policy.exists() else ''
for token in ['visual_review_gate_conditional: true', 'human_visual_acceptance_required_for_parity: true', 'automated_visual_comparison_authority: evidence-only']:
    if token not in policy_text:
        errors.append(f'Project policy missing Visual Review contract: {token}')
context = ROOT / '.agentic-harness' / 'context-map.yml'
context_text = context.read_text(encoding='utf-8') if context.exists() else ''
for token in ['visual_validation:', 'VISUAL_REFERENCE_HUMAN_PARITY_STANDARD.md', 'tooling/visual-review/']:
    if token not in context_text:
        errors.append(f'Context map missing Visual Review progressive-disclosure token: {token}')
if errors:
    print('VISUAL REVIEW POLICY VALIDATION FAILED')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)
print('VISUAL REVIEW POLICY VALIDATION PASSED')
