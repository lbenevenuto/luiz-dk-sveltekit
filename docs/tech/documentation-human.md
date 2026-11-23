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
topic_id: OS-DOCS-TECH-DOCUMENTATION
doc_id: OS-DOCS-TECH-DOCUMENTATION-HUMAN-MD
title: documentation — human
pair_role: human
pair_doc_id: OS-DOCS-TECH-DOCUMENTATION-AI-MD
---

# Harness runtime

## Responsibility

Validate hDS document metadata, human/AI pairs, revisions, local links, assets and documentary exceptions. Parsing is deterministic and offline; document truth and semantic equivalence require agent review. This module never repairs product code.

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

- `scripts/hds_gate.py` — Deterministic offline gate for hDS documentation. Public definitions: run, main
- `scripts/hds_validation/__init__.py` — hDS validation package.
- `scripts/hds_validation/common.py` — Shared parsing and safety contracts; no network or repository mutation. Public definitions: UniqueLoader, unique_mapping, load_yaml, version_tuple, valid_date, parse_doc, resolve_local, load_registry, fields, unique_records, check_date
- `scripts/hds_validation/documents.py` — Validate metadata, explicit pairs, revision records and Markdown basics. Public definitions: scan, lint, check_pairs
- `scripts/hds_validation/evolution.py` — Read-only Git evolution gate. Public definitions: git, validate
- `scripts/hds_validation/links.py` — Offline Markdown links and GitHub-style heading anchors. Public definitions: visible, anchors, extract, validate
- `scripts/hds_validation/registries.py` — Ownership, evidence registries, asset integrity and scoped waivers. Public definitions: validate, validate_assets, size_checks
- `scripts/hds_validation/scope.py` — Documentation scope. Source-code quality belongs to the delivery OS. Public definitions: excluded
- `scripts/project_hds.py` — hDS consumer adapter: preserve untouched adopted documents. Public definitions: validate, main
- `scripts/validate_hds.py` — Validate hDS while preserving untouched legacy documents during adoption.
- `scripts/validate_project_hds.py` — Deterministic capsule governance utility.
