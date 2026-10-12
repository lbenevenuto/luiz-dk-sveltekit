---
name: hds-update
version: 1.1.0
description: "Update hDS documentation after project, architecture, governance or implementation changes."
owner: "hyst / Marcelo Moreira"
---
# hDS Update Skill

## When to use
Use when a change creates or modifies project understanding, architecture, business rules, delivery status, security posture, operating process or decision history.

## When not to use
Do not use this skill to bypass implementation contracts, security review, objective sensors, human approval for sensitive changes, or hDS documentation requirements. Do not use it when the task requires production data access without explicit authorization.

## Inputs
- Objective or user request.
- Relevant project documents or state files.
- Active implementation contract when applicable.
- Known constraints, risks, acceptance criteria and validation commands.

## Instructions
Read the relevant current hDS docs. Identify which audience needs an update. Preserve front matter, SemVer and human/AI pairing. Write substantive content explaining why the change matters, not only what changed. Update decisions and progress files. Run hDS validation.

## Outputs
Updated hDS documents, updated state files and validation summary.

## Validation
The agent must record the result in `.agentic-harness/state/AGENT_VALIDATION.md` when the skill changes code, documentation, architecture or delivery state. If validation fails, create a blocker instead of declaring completion.
