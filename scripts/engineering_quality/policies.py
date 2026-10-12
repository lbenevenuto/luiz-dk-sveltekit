"""The public engineering contract inherited by every generated capsule."""
from pathlib import Path

ENGINEERING = ('code-organization-policy', 'reuse-and-extension-policy',
               'class-design-policy', 'helper-policy', 'refactoring-policy',
               'engineering-standards', 'testing-strategy', 'dependency-policy',
               'api-contract-policy', 'data-privacy-and-tenant-isolation-policy',
               'observability-and-operability-policy', 'performance-and-scalability-policy',
               'secure-coding-and-threat-model-policy')
DISCIPLINE = ('anti-hallucination-and-evidence-policy', 'deterministic-execution-policy',
              'no-workarounds-and-real-resolution-policy')
FILES = tuple(f'docs/harness/{folder}/{name}-{role}.md'
              for folder, names in (('software-engineering', ENGINEERING), ('discipline', DISCIPLINE))
              for name in names for role in ('human', 'ai'))

def validate(root, errors):
    for rel in FILES:
        path = root / rel
        if not path.is_file() or path.is_symlink():
            errors.append(f'missing inherited engineering policy: {rel}')
        elif 'engineering_evidence' not in path.read_text():
            errors.append(f'{rel}: mandatory change evidence contract missing')
    path = root / 'docs/DOCUMENTED_ENGINEERING_STANDARD.md'
    if not path.is_file() or 'engineering_evidence' not in path.read_text():
        errors.append('mandatory documented engineering evidence standard missing')
