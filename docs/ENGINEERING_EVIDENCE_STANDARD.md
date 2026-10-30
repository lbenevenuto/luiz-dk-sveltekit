---
doc_id: OS-DOCS-ENGINEERING-EVIDENCE-STANDARD-MD
title: Engineering change evidence
owner: hyst
lang: en
audience: tech
tags:
- agentic-os
document_type: guide
pair_required: false
status: review
version: 0.1.0
last_updated: '2026-10-12'
---

# Engineering change evidence

## Responsibility

Agentic Delivery OS requires investigated, reviewed changes. hDS documents contracts,
business rules and technical decisions; it does not repair or certify product code.
The gate verifies completeness, paths, hashes and recorded successful commands.
It cannot prove that a search was exhaustive, a record honest or a design correct.

## Required workflow

Before implementation, read the relevant business and technical hDS pairs, ADRs,
current contracts, callers, tests and dependency versions. Search the accessible
repository for equivalent responsibilities, symbols and domain terms. Inspect the
candidate implementation and its consumers before choosing reuse, extension,
consolidation, a new implementation or removal. A new implementation must explain
why inspected candidates do not satisfy the contract; absence of matches is a
recorded search result, never permission to invent missing requirements.

Investigate official API, configuration, supported hooks/extensions and providers
before writing custom integration. For bugs, distinguish the observed symptom
from the supported cause, repair the cause and run a regression that exercises it.
For a feature/refactor, explain the need and preserved behavior. Unknown business
decisions block dependent implementation and remain explicit questions.

Choose classes for coherent state, invariants, lifecycle, domain behavior or real
polymorphic contracts; functions for predictable transformations; composition
and supported extensions for real variations. Helpers remain small, semantic and
low in coupling. Business behavior belongs to the domain, external I/O to adapters,
and coordination to application services. No static utility bags, deep inheritance
without a contract, clone implementations or artificial splits to meet a counter.
Review semantic duplication even when the lexical detector passes.

## Record contract

Every new or edited source must belong to a coverage unit in
`.agentic-harness/documentation-coverage.yml`. The unit's `engineering_evidence`
points to a YAML decision record. Its hash belongs in `document_hashes` alongside
the human/AI technical documentation and narrative review. Start from
`docs/_templates/harness/template-engineering-evidence.yml`, replace placeholders
with actual investigation and add captured artifacts to Git.

The YAML requires:

- `schema_version: 1.0.0`, matching `unit_id`, `reviewer` and `reviewed_on`.
- `sources`: exactly the coverage unit's path/SHA256 map.
- `artifacts`: local investigation, contracts and executed-check output with SHA256.
- `investigation`: context, nonempty searches with argument-array command, scope,
  actual result and artifact, plus inspected source/contract references.
- `reuse`: decision (`reuse`, `extend`, `consolidate`, `new`, `remove`), rationale,
  alternatives and inspected/hash-bound candidates. No-match results can justify
  an empty candidate list only for new code or removal.
- `architecture`: responsibilities, boundaries, abstraction choice and rationale,
  semantic duplication review and risks. `cohesion_review` is mandatory for files
  above 300 lines. New/edited source above 500 lines fails regardless of rationale.
- `resolution`: kind (`feature`, `fix`, `refactor`, `removal`, `canonical_export`),
  cause or need, official mechanisms investigated, solution and regression.
  `workaround: false` is required for a complete delivery. A temporary mitigation
  remains an open incident/blocker; it cannot be declared a completed correction.
- `validation`: executed argument-array commands, integer zero exit codes,
  substantive actual results and hashed output artifacts. Product stack commands
  also execute at the gate; a written result never replaces their execution.

Sources, candidate implementations, authoritative contract artifacts and outputs
are committed with their evidence. Fresh hashes require renewed inspection, not
an automatic claim of review. Do not invent commands or copy a prior result onto
changed code. Captured official documentation can be referenced as a local hashed
artifact. Tests use controlled inputs, explicit expected contracts and reproducible
commands; hypotheses and untested limitations remain labelled.

## Scope and inheritance

Pre-commit checks the exact index; pre-push/CI check committed snapshots against a
real base. Untouched legacy remains queued. New or edited files are reviewed as
whole files. Changing an evidence artifact also invalidates its associated review.
Removal requires `removed_sources` (prior path/SHA256) in both the coverage unit and its evidence, with `resolution.kind: removal`; a unit can have an empty `sources` map only when it retains reviewed removals. Include documentation updates and affected
consumers and preserved contracts. Renames require current path/hash evidence.

A capsule inherits the full public software-engineering policies, the evidence,
deterministic execution and real-resolution policies, this standard and template.
Removing a mandatory policy or its evidence directive fails the engineering gate.
Canonical exported OS infrastructure carries explicit source inspection output and
reviewed component decisions. That narrow provenance never certifies consumer
code or future modifications and never represents human approval.
