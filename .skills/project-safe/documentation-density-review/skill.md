# Documentation Density Review

## When to use

Use this skill when hDS documents may be too shallow, too verbose, duplicated or missing operational value. It is intended for agentic engineering work inside the hyst Agentic Harness and must preserve hDS, security, quality gates and implementation contracts.

## When not to use

Do not use this skill when the task is trivial, when the decision has already been explicitly made and documented, or when using the skill would add process without reducing risk. Do not use it to justify overengineering.

## Inputs

- Project context and current hDS documents.
- Relevant `AGENT_STATE.md`, `AGENT_DECISIONS.md` and implementation contract.
- Business constraints: budget, deadline, risk, client expectation and operational maturity.
- Technical constraints: architecture, security, data, integrations, performance and test coverage.

## Instructions

1. Check whether the document has objective, context, decision, criteria, validation and risks.
2. Remove filler, repetition and generic best-practice language.
3. Preserve implementation details, decisions, commands, risks and validation criteria.
4. Decide whether to merge, split or rewrite documentation.
5. Fail documents that cannot guide a new human or agent safely.

## Outputs

- A concise recommendation with rationale.
- Trade-offs, risks and rejected alternatives.
- hDS or `AGENT_DECISIONS.md` updates when required.
- Validation checklist and next action.

## Validation

The output is valid only if it is proportional to the project, actionable by another agent or engineer, and aligned with gold-standard engineering, banking-grade security, hDS and delivery constraints. It fails if it is generic, superficial, or ignores budget and deadline.
