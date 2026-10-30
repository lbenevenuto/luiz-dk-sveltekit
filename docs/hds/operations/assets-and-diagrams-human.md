---
doc_id: HDS-DOCS-HDS-OPERATIONS-ASSETS-AND-DIAGRAMS-HUMAN
title: Artefatos e diagramas — visão humana
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: manager
last_updated: '2026-10-12'
tags:
- hds
document_type: guide
pair_required: true
pair_role: human
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-ASSETS-AND-DIAGRAMS-AI
topic_id: OS-DOCS-HDS-OPERATIONS-ASSETS-AND-DIAGRAMS
---

# Artefatos e diagramas

Prefira diagramas como código, SVG e fontes editáveis. Guarde material em `docs/assets/diagrams/`, `mer/`, `images/`, `schematics/` ou `pdfs/` conforme o tipo.

Registre todos os arquivos em `.hds/assets.yml`. Cada item contém `asset_id`, `kind`, `files`, `editable_sources`, `used_by` (IDs), `owner`, `last_updated`, `provenance` e `checksums` (caminho → SHA-256).

Diagramas exportados exigem fonte editável versionada. Fotos, capturas e PDFs externos podem declarar `editable_sources: []`, com origem e motivo em `provenance`. Isso não autoriza salvar informação pessoal ou segredo sem autorização.

Commite fonte e export juntos quando houver ambos. Referencie o artefato por link relativo no documento consumidor. Bibliografia guarda a referência externa; o registro guarda origem e uso local.

Arquivos `.gitkeep` são marcadores, não artefatos. O registro inicial vazio declara ausência de artefatos entregues e não simula um diagrama existente.
