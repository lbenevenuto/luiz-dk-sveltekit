---
doc_id: OS-DOCS-DOCUMENTED-ENGINEERING-STANDARD-MD
title: Documented engineering standard
owner: hyst
lang: en
audience: tech
tags:
- agentic-os
document_type: guide
pair_required: false
status: review
version: 0.1.3
last_updated: '2026-10-12'
---

# Documented engineering standard

## Responsibilities

hDS means hyst Documenting System. It governs documentation, its identity,
versioning, human/AI presentation, provenance and maintenance. It never repairs,
refactors or certifies product source code. Agentic Delivery OS governs the agent
that produces both implementation and documentation and enforces completion.

## Mandatory delivery workflow

1. Inspect the task, source, current technical documentation and business rules.
2. Identify the canonical implementation before adding anything. Prefer cohesive
   classes, supported class extensions/composition, helpers, functions and
   procedures according to language and responsibility. Do not force inheritance
   where composition or a function is clearer. Do not clone implementations.
3. Write or update business rules separately in `docs/business/`: origin,
   conditions, exceptions, permissions, transitions, business invariants and
   examples. Human and AI documents are reciprocal presentations of one rule.
4. Implement the smallest coherent change. Fix violations in affected source
   before completion; preserve observable behavior and validate the refactor.
5. Write or update technical documentation separately in `docs/tech/`: module
   responsibility, public interfaces, inputs/outputs, dependencies, class/function
   roles, errors, edge cases, security, data flow and validation. Explain why the
   design exists, rather than copying source code into prose.
6. Connect the implementation to both technical presentations and relevant
   business rules through `.agentic-harness/documentation-coverage.yml`. Update
   source hashes, review evidence and document revisions only after inspection.
7. Run hDS, engineering and the declared product-stack checks. Any failing gate
   is a blocker and must be corrected. A TODO, refactor plan or comment is not a
   passing gate. Do not change policy or exclusions to hide a failure.
8. Update the existing OS state, TODO, blocker, evidence and handoff mechanisms.
   Keep untouched inherited findings in the legacy backlog; they do not block
   an unrelated commit. Repair all applicable violations in a new or edited file.

## Technical and business documentation

Business documentation answers what the product must do and why. Technical
documentation answers how the implementation provides it and what contracts a
maintainer must preserve. A unit may span several source files. Do not require a
separate document for every trivial function, and do not hide unrelated modules
in an omnibus document. Shared rules have one canonical pair referenced by their
consumers. Infrastructure with no product business rule needs an explicit
non-applicability reason; product rules must never be inferred as absent.

The human presentation uses connected explanation, examples and diagrams when
useful. The AI presentation enumerates contracts, preconditions, invariants,
failure cases, prohibited changes and validation commands. Both share version,
status, owner, date and meaning, while serving different reading needs.

## Completion and evidence

New or edited source over 500 physical lines fails. Above 300 lines requests cohesion review.
No hand-maintained source-size waiver is accepted by the engineering gate.
Immutable generated/vendor/history/portable-skill artifacts can be excluded only
individually with hash, origin, reason and declared kind. Changed excluded bytes
fail and must be reinspected. Never exclude product code to evade the standard.

The deterministic duplicate gate detects exact token blocks of at least 100
tokens spanning 10 lines, within or across files. It supplements mandatory agent
review for smaller clones, renamed copies, equivalent algorithms, responsibility
mixing and unjustified abstractions. Lexical success does not prove semantic
quality. A confirmed defect must be repaired, irrespective of detector threshold.

Declare actual stack lint, typecheck, test and build commands before implementing
product code. Missing commands are a blocker, not an `--if-present` success.
Source-to-doc hashes require review after code changes; hDS Git-base checks require
document SemVer and revision updates. Review evidence must describe assessment,
commands, actual results and remaining limits. No automatic human approval.

## Adoption boundary

New capsules receive these controls by default, from canonical scripts. Existing
capsules are not updated by this release. OS, hDS and product versions are
independent. Generation with failed checks returns nonzero; skipped checks mean
unvalidated and cannot create a validated baseline commit.

## Legacy adoption and exact commit scope

At adoption, inventory existing files without certifying their quality. Preserve
untouched source and documents; record size, duplication and documentation debt
in `.agentic-harness/legacy-findings.yml`, linked from the existing agent queue.
The adoption inventory is immutable and is never refreshed to exempt an edit.

Pre-commit validates indexed bytes: the complete files selected by `git add`, not
only changed lines and not a later working-tree copy. Unstaged defects do not
block an unrelated commit; an unstaged repair does not make indexed defects pass.
New, modified and renamed files must be compliant as whole files. A deleted file
must have its documentation coverage updated. Returning a file to its original
bad bytes is still an edit and cannot reuse the adoption exemption.

Duplicate checks compare touched files against the whole source inventory, so a
new or edited copy of untouched legacy still fails. Two untouched inherited
copies remain a queued finding. Product validation commands must target changed
code and relevant contracts; they receive AGENTIC_CHANGED_SOURCE_FILES_JSON.
Do not require unrelated historical failures to be repaired in the same unit.

Run `python3 scripts/audit_legacy.py` before staging evidence. The hook can update
the working backlog but never adds files to the index automatically. Stage the
backlog with the task record. Pre-push and CI validate committed snapshots against
a real base. Full audit is explicit and is not the incremental commit gate.

## Engineering evidence gate

Every new or edited source requires `engineering_evidence` under the coverage unit. Read `docs/ENGINEERING_EVIDENCE_STANDARD.md` and the inherited software-engineering and execution-discipline policies. Repository searches, inspected references, reuse decisions, architectural assessment, cause-root correction and actual validation outputs must be recorded with source/artifact hashes. Missing, placeholder or stale evidence blocks commit; structural success never proves semantic quality.

## Enforced continuity — 1.9.0

Each changed project unit requires a fresh checkpoint with canonical AGENT state, tasks and acceptance, decisions, blockers/questions, actual validation and a concrete next action. Exact-index/commit gates reject stale or contradictory state and immutable-history rewrites. Run `python3 scripts/resume_project.py` at session entry and follow `docs/CONTINUITY_STANDARD.md`. Saved snapshots survive agent replacement when the directory/Git history is preserved; unsaved chat is not automatically captured.
