---
doc_id: OS-START-HERE-FOR-AGENTS-MD
title: Start Here for Agents — luiz-dk-sveltekit
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

# Start Here for Agents — luiz-dk-sveltekit

You are inside a standalone project generated from a private Agentic Delivery OS. Do not assume prior conversation context. Do not request the private OS by default. Work from the local capsule.

## Mandatory reading order

1. `00-NEXT_AGENT_STARTUP.md`
2. `START_HERE_FOR_AGENTS.md`
3. `README.md`
4. `PROJECT_BRIEF.md`
5. `AGENTS.md`
6. `GUARDRAILS.md`
7. `ENGINEERING_GUARDRAILS.md`
8. `.agentic-harness/manifest.yml`
9. `.agentic-harness/project-policy.yml`
10. `.agentic-harness/validation-policy.yml`
11. `.agentic-harness/architecture-policy.yml`
12. `.agentic-harness/security-policy.yml`
13. `AGENT_HANDOFF.md`

## Required behavior

Run `bash scripts/run_all_checks.sh` before implementation when tooling is available. Confirm the bootstrap baseline commit exists. If it does not exist, run `bash scripts/finalize_bootstrap_commit.sh` before implementation. If the capsule is incomplete, update `AGENT_BLOCKERS.md` and stop. Do not hallucinate, fake validation, bypass quality, expose secrets or copy private methodology internals.
