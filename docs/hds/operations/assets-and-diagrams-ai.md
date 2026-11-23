---
doc_id: HDS-DOCS-HDS-OPERATIONS-ASSETS-AND-DIAGRAMS-AI
title: Artefatos e diagramas — contrato para agentes
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- hds
document_type: guide
pair_required: true
pair_role: ai
pair_doc_id: HDS-DOCS-HDS-OPERATIONS-ASSETS-AND-DIAGRAMS-HUMAN
topic_id: OS-DOCS-HDS-OPERATIONS-ASSETS-AND-DIAGRAMS
---

# Contrato de artefatos

1. Classificar tipo e origem; preferir fonte textual/editável.
2. Salvar arquivos em `docs/assets/`.
3. Adicionar item único em `.hds/assets.yml` com SHA-256 por arquivo.
4. Para `kind: diagram`, fornecer pelo menos uma fonte editável.
5. Garantir existência de arquivos, fontes e IDs em `used_by`.
6. Validar hash e consumo por documento real.
7. Se atualizar arquivo, atualizar hash, data e documentação afetada.

Não declarar fonte fictícia, consumidor inexistente ou registro aprovado sem artefato. O check não interpreta o conteúdo visual.
