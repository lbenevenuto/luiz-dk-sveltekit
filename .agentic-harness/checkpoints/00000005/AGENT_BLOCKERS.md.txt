---
doc_id: OS-AGENT-BLOCKERS-MD
title: Agent Blockers
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

# Agent Blockers

## Active checkpoint

Checkpoint: ados-adoption-validated. Phase: project_readiness. Outcome: in_progress. Current task: ADOPT-EXISTING-REPO. Recorded by: Claude Code ADOS adoption into existing repository.

ADOS 1.9.2 capsule integrated into the existing repository and validated: capsule checks, lint, typecheck and unit tests pass. Baseline commit is established when the adoption pull request merges.

## Blockers

No blocker observed; validation is the remaining step for this unit.

## Questions and assumptions awaiting evidence

The repository owner explicitly requested ADOS adoption and a pull request; product scope is unchanged.

## Continuity contract

The active structured record and immutable archived states live in .agentic-harness/checkpoints/. Run `python3 scripts/resume_project.py` and inspect actual Git status before continuing. A checkpoint preserves saved facts only; it does not capture unsaved conversations or certify decision truth. Preserve untouched legacy findings in .agentic-harness/legacy-findings.yml and repair the complete files changed by this unit.
