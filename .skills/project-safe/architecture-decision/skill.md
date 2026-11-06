# Architecture Decision

## When to use

Use this skill when an agent must choose between monolith, modular monolith, microservices, workers, jobs, serverless, event-driven architecture or another architectural style. It is intended for agentic engineering work inside the hyst Agentic Harness and must preserve hDS, security, quality gates and implementation contracts.

## When not to use

Do not use this skill when the task is trivial, when the decision has already been explicitly made and documented, or when using the skill would add process without reducing risk. Do not use it to justify overengineering.

## Inputs

- Project context and current hDS documents.
- Relevant `AGENT_STATE.md`, `AGENT_DECISIONS.md` and implementation contract.
- Business constraints: budget, deadline, risk, client expectation and operational maturity.
- Technical constraints: architecture, security, data, integrations, performance and test coverage.

## Instructions

1. Evaluate domain complexity, data ownership, scale, deploy independence, failure isolation, compliance, team maturity, cost and deadline.
2. Compare at least two viable alternatives.
3. Prefer the smallest safe architecture that preserves evolution.
4. Recommend microservices only with clear operational justification.
5. Recommend modular monolith when it is faster and safer, but define extraction seams.
6. Record the decision and triggers for future evolution.

## Outputs

- A concise recommendation with rationale.
- Trade-offs, risks and rejected alternatives.
- hDS or `AGENT_DECISIONS.md` updates when required.
- Validation checklist and next action.

## Validation

The output is valid only if it is proportional to the project, actionable by another agent or engineer, and aligned with gold-standard engineering, banking-grade security, hDS and delivery constraints. It fails if it is generic, superficial, or ignores budget and deadline.
