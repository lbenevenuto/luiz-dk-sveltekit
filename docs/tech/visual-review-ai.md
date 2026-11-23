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
topic_id: OS-DOCS-TECH-VISUAL-REVIEW
doc_id: OS-DOCS-TECH-VISUAL-REVIEW-AI-MD
title: visual-review — ai
pair_role: ai
pair_doc_id: OS-DOCS-TECH-VISUAL-REVIEW-HUMAN-MD
---

# Harness runtime contract for agents

This is the execution contract. Consult the human presentation for rationale.

## Responsibility

- Required contract: Capture executable-reference scenarios, compare image evidence, validate paths and run identity, record reports and human parity decisions. Automated comparison provides triage; explicit Human Visual Acceptance remains the parity authority.

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

- `tooling/visual-review/bin/visual-review.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/examples/visual-review.config.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/browser-validation.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/capture-sequence.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/capture.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/comparison.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/config.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/index.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/interactions.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/png-comparison.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/report.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/review.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/run.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/util.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/src/validation.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/browser-validation.test.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/config-contract.test.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/helpers/fixtures.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/helpers/pngjs-shim/index.cjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/interactions-capture.test.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/path-safety.test.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/pipeline-report-review.test.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/png-comparison.test.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/public-api.test.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/tests/run-paths-staleness.test.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
- `tooling/visual-review/vendor/png-rgba-codec.mjs` — Visual review infrastructure: capture, compare, report and explicit human parity evidence; tests use deterministic fixtures.
