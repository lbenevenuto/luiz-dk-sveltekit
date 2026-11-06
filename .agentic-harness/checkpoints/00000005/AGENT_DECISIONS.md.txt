---
doc_id: OS-AGENT-DECISIONS-MD
title: Agent Decisions
owner: hyst
lang: en
audience: tech
tags:
- agentic-os
- continuity
document_type: record
pair_required: false
status: review
version: 0.1.5
last_updated: '2026-10-12'
checkpoint_id: ados-adoption-validated
phase: project_readiness
outcome: in_progress
---

# Agent Decisions

## Active checkpoint

Checkpoint: ados-adoption-validated. Phase: project_readiness. Outcome: in_progress. Current task: ADOPT-EXISTING-REPO. Recorded by: Claude Code ADOS adoption into existing repository.

ADOS 1.9.2 capsule integrated into the existing repository and validated: capsule checks, lint, typecheck and unit tests pass. Baseline commit is established when the adoption pull request merges.

## Decisions and rationale

- CANONICAL-STATE: Use the declared canonical state files and immutable checkpoint history for project continuity.
  Reason: A single active checkpoint prevents independent state copies from silently diverging during agent replacement.
  Evidence: docs/CONTINUITY_STANDARD.md
- PRESERVE-EXISTING-ROOT-FILES: Restore README.md, CHANGELOG.md and .gitignore to their pre-bootstrap content and keep them as untouched legacy files.
  Reason: The generator overwrites existing files. CHANGELOG.md is owned by semantic-release and README.md/.gitignore describe the live product and its tooling.
  Evidence: .agentic-harness/legacy-baseline.yml
- EXTEND-AGENTS-MD: Keep the original AGENTS.md rules and append an ADOS section with hDS front matter.
  Reason: CLAUDE.md and GEMINI.md import AGENTS.md; the engineering guardrail validator requires AGENTS.md to reference ENGINEERING_GUARDRAILS.md.
  Evidence: AGENTS.md
- KEEP-HUSKY-DEFAULT: Do not chain the ADOS pre-commit gate into Husky; ADOS hooks are opt-in via scripts/install-git-hooks.sh, and CI enforces the gate.
  Reason: Husky runs in CI through the prepare script; chaining would make semantic-release and dependency-update commits depend on Python and checkpoints.
  Evidence: AGENTS.md
- ISOLATE-CAPSULE-FROM-LINT: Exclude generated ADOS paths from Prettier via .prettierignore and tooling/ from ESLint via the lint script.
  Reason: Capsule files are hash-bound by checkpoints and coverage records; reformatting them would invalidate evidence, and tooling/visual-review contains CommonJS helpers that violate the product ESLint rules.
  Evidence: .prettierignore, package.json
- PRODUCT-VERSION-SOURCE: Product version is package.json managed by semantic-release; maturity is production.
  Reason: The generated default 0.0.0-prealpha.0 contradicted the released and deployed product.
  Evidence: PRODUCT_VERSION.md, .github/workflows/deploy.yml

## Continuity contract

The active structured record and immutable archived states live in .agentic-harness/checkpoints/. Run `python3 scripts/resume_project.py` and inspect actual Git status before continuing. A checkpoint preserves saved facts only; it does not capture unsaved conversations or certify decision truth. Preserve untouched legacy findings in .agentic-harness/legacy-findings.yml and repair the complete files changed by this unit.
