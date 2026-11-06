# Service Boundary Assessment

## When to use

Use this skill when a module, service, worker or integration boundary is being created, changed or extracted. It is intended for agentic engineering work inside the hyst Agentic Harness and must preserve hDS, security, quality gates and implementation contracts.

## When not to use

Do not use this skill when the task is trivial, when the decision has already been explicitly made and documented, or when using the skill would add process without reducing risk. Do not use it to justify overengineering.

## Inputs

- Project context and current hDS documents.
- Relevant `AGENT_STATE.md`, `AGENT_DECISIONS.md` and implementation contract.
- Business constraints: budget, deadline, risk, client expectation and operational maturity.
- Technical constraints: architecture, security, data, integrations, performance and test coverage.

## Instructions

1. Identify responsibility, domain, data ownership and contracts.
2. Check coupling, transaction boundaries, API/event needs and tenant isolation.
3. Decide whether the boundary should remain a module, become a worker, or become a microservice.
4. Define contracts, observability, authorization and tests.
5. Reject boundaries that exist only because of technical layering without business meaning.

## Outputs

- A concise recommendation with rationale.
- Trade-offs, risks and rejected alternatives.
- hDS or `AGENT_DECISIONS.md` updates when required.
- Validation checklist and next action.

## Validation

The output is valid only if it is proportional to the project, actionable by another agent or engineer, and aligned with gold-standard engineering, banking-grade security, hDS and delivery constraints. It fails if it is generic, superficial, or ignores budget and deadline.
