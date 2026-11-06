---
doc_id: HDS-DOCS-HDS-GOVERNANCE-REGISTRY-SCHEMAS
title: Schemas dos registros
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- hds
document_type: guide
pair_required: false
---

# Schemas dos registros

Todos os registros são YAML com `schema_version: 2.0.0` e lista nomeada. Listas vazias significam nenhuma entrada registrada; não significam controle externo implementado.

## Ownership — `.hds/ownership.yml`

`areas`: `path` (glob relativo), `owner`, `responsibility`. Cada documento governado deve corresponder a uma área; funções são válidas. CODEOWNERS é uma adaptação opcional e exige identidades reais antes de ativar aprovação por owner na plataforma.

## Findings — `.hds/findings.yml`

`findings`: `finding_id`, `status` (`open`, `in_progress`, `resolved`, `accepted_risk`), `severity` (`low`, `medium`, `high`, `critical`), `owner`, `location`, `evidence`, `impact`, `next_action`, `closure_criteria`.

`resolved` requer `resolution_evidence`. `accepted_risk` requer `approved_by`, `reason` e `expires_on` futuro ou atual. A localização deve existir; o registro não comprova que o problema foi solucionado.

## Waivers — `.hds/waivers.yml`

`waivers`: `waiver_id`, `path` exato, `rule` (`file_size`), `reason`, `approved_by`, `approved_on`, `expires_on`, `compensating_control`. Prazo deve estar vigente. Waivers se aplicam somente à regra e ao arquivo declarados, nunca a pares, links ou evidências.

## Assets — `.hds/assets.yml`

`assets`: `asset_id`, `kind` (`diagram`, `image`, `pdf`, `data`, `other`), `files`, `editable_sources`, `used_by`, `owner`, `last_updated`, `provenance`, `checksums`. Caminhos são relativos à raiz e ficam em `docs/assets/`. Arquivo pode pertencer somente a uma entrada. Hashes são SHA-256.

## Revisões — `docs/evidence/revision-register.yml`

`revisions`: `doc_id`, `version`, `date`, `author`, `change`, `action`. Ações: `created`, `updated`, `removed`. Cada documento atual deve ter entrada para sua versão atual, com data e ação coerentes. Remoções ficam registradas mesmo sem o documento atual.
