#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
python3 scripts/validate_git_repository.py
python3 scripts/validate_project_capsule.py
python3 scripts/validate_project_hds.py
python3 scripts/validate_briefing_bootstrap.py
python3 scripts/validate_next_agent_startup.py
python3 scripts/validate_input_assets_scaffold.py
python3 scripts/validate_generated_metadata.py
python3 scripts/validate_v154_project_policy.py
python3 scripts/validate_engineering_guardrails.py
python3 scripts/validate_visual_review_policy.py
python3 scripts/validate_engineering_quality.py
echo "ALL AVAILABLE CHECKS PASSED"
