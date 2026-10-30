#!/usr/bin/env bash
set -euo pipefail
git rev-parse --git-dir >/dev/null
current_hooks="$(git config --get core.hooksPath || true)"
if [[ -n "$current_hooks" && "$current_hooks" != ".githooks" ]]; then
  echo "Existing custom hooks path must be preserved: $current_hooks" >&2
  exit 1
fi
git config core.hooksPath .githooks
echo "Git hooks installed: .githooks"
