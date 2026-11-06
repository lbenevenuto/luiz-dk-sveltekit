---
doc_id: OS-GUARDRAILS-MD
title: Guardrails — luiz-dk-sveltekit
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

# Guardrails — luiz-dk-sveltekit

Enterprise-grade delivery is mandatory. No secrets in prompts or commits. No sensitive client data in unapproved tools. No shortcuts that hide root causes. No architecture change without documented decision. No release without evidence. Raw briefing material must not be modified or committed unless a human explicitly approves. Product implementation must not start until the bootstrap capsule has passed checks and is committed as a clean baseline. `ENGINEERING_GUARDRAILS.md` is mandatory and carries the inherited global engineering rules; it must be read before implementation, integration, migration, modernization, or replatforming work. If visual fidelity to an approved executable reference is claimed, `VISUAL_REFERENCE_HUMAN_PARITY_STANDARD.md` is mandatory; automated comparison cannot grant visual acceptance and parity must remain separate from Taste Review.

## Mandatory documented engineering

Read docs/DOCUMENTED_ENGINEERING_STANDARD.md, docs/ENGINEERING_EVIDENCE_STANDARD.md and the human/AI engineering policies under docs/harness/software-engineering/ and docs/harness/discipline/. Every code change requires investigation, reuse and architectural evidence. hDS documentation and blocking engineering gates are mandatory before task completion.

## Mandatory continuity

Run `python3 scripts/resume_project.py` before work. Read docs/CONTINUITY_STANDARD.md and the active checkpoint in .agentic-harness/continuity.yml. Canonical state paths are declared in .agentic-harness/continuity-config.yml. Save an explicit checkpoint before implementation, after decisions and validation milestones, at least every 15 minutes of substantive work, and before handoff or interruption. Never infer facts from prior chat or silently discard unrecorded changes.
