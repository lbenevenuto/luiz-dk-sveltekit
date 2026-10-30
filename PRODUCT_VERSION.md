---
doc_id: OS-PRODUCT-VERSION-MD
title: Product Version — luiz-dk-sveltekit
owner: hyst
lang: en
audience: tech
tags:
- agentic-os
document_type: guide
pair_required: false
status: review
version: 0.1.1
last_updated: '2026-10-12'
---

# Product Version — luiz-dk-sveltekit

## Product version

Source of truth: `version` in `package.json` (1.6.15 at ADOS adoption), managed by semantic-release from Conventional Commits. The root `VERSION` file is the capsule documentation version, not the product version.

## Product maturity

`production`: semantic-release publishes a GitHub release from `main` and `.github/workflows/deploy.yml` deploys each published release to Cloudflare Pages.

## OS/capsule version

Agentic Delivery OS capsule exported from `1.9.2`. This is not the product version.

## Rule

Do not confuse OS maturity with product maturity. Product release readiness must be proven independently.
