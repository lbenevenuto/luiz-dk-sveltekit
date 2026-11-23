#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

bash scripts/run_all_checks.sh

if [ ! -d .git ]; then
  git init
fi

git add -A
if git diff --cached --name-only | grep -E '^briefing/' >/dev/null 2>&1; then
  echo "ERROR: raw briefing files are staged. They are ignored by default and must not be committed without explicit human approval."
  exit 1
fi

if git diff --cached --quiet; then
  echo "No staged changes to commit. Existing baseline may already be present."
else
  git commit -m "chore: bootstrap project harness capsule"
fi

python3 scripts/validate_baseline_commit.py

echo "BOOTSTRAP BASELINE COMMIT READY"
