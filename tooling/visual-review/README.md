---
doc_id: OS-TOOLING-VISUAL-REVIEW-README-MD
title: Visual Review Harness — native Agentic Delivery OS capability
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

# Visual Review Harness — native Agentic Delivery OS capability

Internal capability version: `0.1.0`.

This directory is shipped inside Agentic Delivery OS and copied into generated project capsules. It is not a separately published package and does not require an npm registry.

## Authority model

- Automated visual comparison is evidence and triage.
- Human Visual Acceptance is the final authority for visual parity.
- Parity and Taste Review are separate questions.

## Generic contract

The harness owns reusable evidence mechanics: config/run validation, safe evidence paths, immutable run identity, interaction ordering, frozen-clock application, capture sequencing, exact RGBA comparison, hashes, diff bounds/crops, report generation, Human-review states and structural validation.

The project owns executable reference/target startup, deterministic application state, browser/runtime selection, project-specific assertions, scenario data and evidence retention location.

### ProjectAdapter — 0.1.0

Only these optional hooks are supported:

- `prepareContext()`
- `preparePage()`
- `assertPage()`

### RuntimeDriver — provisional in 0.1.0

A RuntimeDriver is required and owns runtime identity/provenance, lifecycle, capture execution and runtime evidence. The core does not require Docker, Playwright, Vite, Bun or a particular frontend framework. No silent runtime fallback is allowed.

## Native PNG support

To keep the Agentic Delivery OS ZIP self-contained, the native harness includes a small deterministic PNG codec using only Node.js built-ins. It intentionally supports non-interlaced 8-bit RGBA PNG, the format expected from the validated browser-screenshot path. Unsupported PNG encodings fail visibly rather than falling back or silently converting evidence.

## Run lifecycle

1. `createRun()` pins reference, target, scenario matrix and relevant viewport matrix identity.
2. `captureRun()` produces reference and target screenshots through the supplied RuntimeDriver.
3. `compareRun()` creates exact automated evidence and difference crops.
4. `generateReport()` creates the static Reference-vs-Target review report.
5. Human review remains `pending-review` until a human explicitly records `human-accepted` or `human-rejected`.
6. `validateRun()` checks structural evidence and can report `STALE` if immutable identity has changed.

Automated exactness never grants Human acceptance.

## Tests

From the capsule or OS root:

```bash
node --test tooling/visual-review/tests/*.test.mjs
```
