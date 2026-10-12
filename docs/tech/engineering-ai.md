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
topic_id: OS-DOCS-TECH-ENGINEERING
doc_id: OS-DOCS-TECH-ENGINEERING-AI-MD
title: engineering — ai
pair_role: ai
pair_doc_id: OS-DOCS-TECH-ENGINEERING-HUMAN-MD
---

# Harness runtime contract for agents

This is the execution contract. Consult the human presentation for rationale.

## Responsibility

- Required contract: Inspect source size and syntax, detect duplicate blocks and Python function clones, require reviewed documentation coverage and explicit product-stack checks. A blocking finding returns failure. This module does not automatically refactor implementation.

## Contracts

- Required contract: Input: an explicit project root, actual source files, YAML registries and optional real Git base. Output: diagnostics and nonzero exit status on a blocking error. Bootstrap writes only during an explicitly invoked creation operation.

## Invariants

- Required contract: hDS is mandatory. Product and standard versions are independent. Technical documents have reciprocal human/AI identities. Source changes invalidate their stored coverage hashes. No critical violation is converted into success.

## Failure modes

- Required contract: Malformed metadata, missing documents, broken links, stale source hashes, absent review evidence, new or edited source over 500 lines and detected duplicate blocks involving touched files fail completion. Untouched inherited debt is queued. Runtime/tool errors also fail. A passing lexical detector does not prove absence of semantic duplication.

## Validation

- Required contract: Run bash scripts/run_all_checks.sh. OS regression tests generate an isolated capsule and inject violations to verify failures. Product lint, typecheck, tests and build must run through declared stack checks once product implementation exists.

## Business impact

- Required contract: Infrastructure enforces delivery governance. Product rules must be authored separately under docs/business, with human/AI pairs and references from coverage units whenever implementation introduces or changes those rules.

## Agent obligations

- Load current business-rule pairs before changes.
- Reuse canonical modules and fix blocking defects.
- Refresh code/documentation review only after inspection.
- Never claim human approval or complete semantic verification from a structural check.


## Source inventory

- `scripts/engineering_quality/__init__.py` — Agentic OS engineering gates; hDS owns documentation only.
- `scripts/engineering_quality/change_scope.py` — Resolve changed paths and validate an exact index/commit snapshot. Public definitions: git, has_head, changed, enforce_baseline_identity, snapshot, selected
- `scripts/engineering_quality/change_validation.py` — Shared index/commit checks and reporting; no duplicated gate implementation. Public definitions: check_view, report
- `scripts/engineering_quality/checkpoint.py` — Explicitly save supplied facts; never stage files or infer success. Public definitions: initialize_config, task_lines, records, render, state_document, collect_artifacts, record
- `scripts/engineering_quality/cli.py` — Fail closed for structure, duplication and documentation coverage. Public definitions: run, main
- `scripts/engineering_quality/continuity.py` — Continuity facts and exact-snapshot consistency, never conversation capture. Public definitions: state_paths, config, identifier, references, facts, protected, validate
- `scripts/engineering_quality/continuity_history.py` — Immutable checkpoint chain, archived state and base-ref enforcement. Public definitions: head, pending_tasks, decision_history, check_chain, validate_base
- `scripts/engineering_quality/coverage.py` — Code-to-documentation and review evidence are OS responsibilities. Public definitions: validate
- `scripts/engineering_quality/duplication.py` — Exact token-block detection; semantic duplication requires review. Public definitions: tokens, validate
- `scripts/engineering_quality/evidence.py` — Validate recorded engineering decisions against the exact reviewed snapshot.

This verifies traceability and freshness, never the truth of an agent's claims. Public definitions: text, local, command, validate, validate_prior_removals
- `scripts/engineering_quality/legacy.py` — Immutable adoption inventory and a separate, actionable legacy backlog. Public definitions: capture, initialize, load, unchanged, audit
- `scripts/engineering_quality/policies.py` — The public engineering contract inherited by every generated capsule. Public definitions: validate
- `scripts/engineering_quality/python_clones.py` — Python body clones include renamed parameters and local bindings. Public definitions: CanonicalBindings, validate
- `scripts/engineering_quality/recovery.py` — Reconcile the persisted checkpoint with actual files and Git, without writes. Public definitions: inspect
- `scripts/engineering_quality/sources.py` — One inventory shared by size, duplication and documentation checks. Public definitions: digest, inventory
- `scripts/engineering_quality/stack.py` — Explicit stack checks cannot silently disappear when product code exists. Public definitions: validate
- `scripts/engineering_quality/structure.py` — Hard source-size limits and deterministic syntax checks. Public definitions: validate
- `scripts/validate_engineering_quality.py` — Agentic OS code quality and documentation completion gate.
- `scripts/validate_file_size_policy.py` — Compatibility entrypoint: source violations now fail automatically.
