---
version: 0.1.0
status: review
owner: hyst
lang: en
audience: tech
last_updated: '2026-10-12'
tags:
- runtime
- technical
document_type: technical
pair_required: true
topic_id: OS-DOCS-TECH-GOVERNANCE
doc_id: OS-DOCS-TECH-GOVERNANCE-HUMAN-MD
title: governance — human
pair_role: human
pair_doc_id: OS-DOCS-TECH-GOVERNANCE-AI-MD
---

# Harness runtime

## Responsibility

Validate capsule completeness, engineering rules, portable skills, boundaries, state and release metadata. Explicit skill/install/export commands preserve their authorization boundaries. These utilities govern delivery infrastructure rather than the consumer product domain.

## Contracts

Input: an explicit project root, actual source files, YAML registries and optional real Git base. Output: diagnostics and nonzero exit status on a blocking error. Bootstrap writes only during an explicitly invoked creation operation.

## Invariants

hDS is mandatory. Product and standard versions are independent. Technical documents have reciprocal human/AI identities. Source changes invalidate their stored coverage hashes. No critical violation is converted into success.

## Failure modes

Malformed metadata, missing documents, broken links, stale source hashes, absent review evidence, new or edited source over 500 lines and detected duplicate blocks involving touched files fail completion. Untouched inherited debt is queued. Runtime/tool errors also fail. A passing lexical detector does not prove absence of semantic duplication.

## Validation

Run bash scripts/run_all_checks.sh. OS regression tests generate an isolated capsule and inject violations to verify failures. Product lint, typecheck, tests and build must run through declared stack checks once product implementation exists.

## Business impact

Infrastructure enforces delivery governance. Product rules must be authored separately under docs/business, with human/AI pairs and references from coverage units whenever implementation introduces or changes those rules.

## Source inventory

- `scripts/audit_legacy.py` — Catalogue legacy findings without blocking unrelated changes.
- `scripts/finalize_bootstrap_commit.sh` — Shell entrypoint for validation or explicit Git bootstrap operations.
- `scripts/install-git-hooks.sh` — Shell entrypoint for validation or explicit Git bootstrap operations.
- `scripts/record_checkpoint.py` — Explicit checkpoint recorder; never invent facts, run checks or stage files. Public definitions: main
- `scripts/resume_project.py` — Read persisted work state and reconcile the real repository, without writes. Public definitions: main
- `scripts/run_all_checks.sh` — Shell entrypoint for validation or explicit Git bootstrap operations.
- `scripts/validate_baseline_commit.py` — Deterministic capsule governance utility.
- `scripts/validate_briefing_bootstrap.py` — Deterministic capsule governance utility.
- `scripts/validate_commit.py` — Push/CI gate validates committed bytes against the supplied base. Public definitions: main
- `scripts/validate_continuity.py` — Read-only working-tree continuity gate. Public definitions: main
- `scripts/validate_engineering_guardrails.py` — Deterministic capsule governance utility.
- `scripts/validate_generated_metadata.py` — Deterministic capsule governance utility.
- `scripts/validate_git_repository.py` — Deterministic capsule governance utility.
- `scripts/validate_input_assets_scaffold.py` — Deterministic capsule governance utility.
- `scripts/validate_next_agent_startup.py` — Deterministic capsule governance utility.
- `scripts/validate_project_capsule.py` — Deterministic capsule governance utility.
- `scripts/validate_staged.py` — Commit gate: validate indexed bytes, not the editable working directory. Public definitions: main
- `scripts/validate_v154_project_policy.py` — Deterministic capsule governance utility.
- `scripts/validate_visual_review_policy.py` — Deterministic capsule governance utility.
