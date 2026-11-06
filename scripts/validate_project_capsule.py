#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
required = [
    '00-NEXT_AGENT_STARTUP.md', 'START_HERE_FOR_AGENTS.md', 'README.md', 'PROJECT_BRIEF.md', 'AGENTS.md', 'GUARDRAILS.md', 'ENGINEERING_GUARDRAILS.md',
    'VERSION', 'CHANGELOG.md', 'VISUAL_REFERENCE_HUMAN_PARITY_STANDARD.md', 'tooling/visual-review/README.md', '.agentic-harness/manifest.yml', '.agentic-harness/project-policy.yml',
    '.agentic-harness/validation-policy.yml', '.agentic-harness/security-policy.yml',
    '.agentic-harness/architecture-policy.yml', '.agentic-harness/context-map.yml',
    '.agentic-harness/export-source.yml', 'AGENT_HANDOFF.md', 'scripts/run_all_checks.sh'
]
errors = [f'Missing required capsule artifact: {rel}' for rel in required if not (ROOT / rel).exists()]
private_paths = ['prompts/internal', 'skills/internal', '.skills/internal', 'docs/method/private', 'docs/fde-career', 'docs/method-commercialization', 'templates/master', 'playbooks/private']
for rel in private_paths:
    if (ROOT / rel).exists():
        errors.append(f'Private method asset must not exist in project repo: {rel}')
if not (ROOT / '.skills/project-safe').exists():
    errors.append('Missing project-safe skills directory: .skills/project-safe')
if errors:
    print('PROJECT CAPSULE VALIDATION FAILED')
    for e in errors:
        print(f'- {e}')
    sys.exit(1)
print('PROJECT CAPSULE VALIDATION PASSED')
