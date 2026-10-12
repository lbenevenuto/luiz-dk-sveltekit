---
doc_id: HDS-POL-005
title: Política de Front Matter do hDS
version: 1.0.1
status: approved
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- agentic-os
document_type: guide
pair_required: false
---

# Objetivo

Definir os metadados mínimos obrigatórios para documentação viva no hDS.

# Campos obrigatórios

Todo documento vivo deve conter, no mínimo:

- `doc_id`
- `title`
- `version`
- `status`
- `owner`
- `lang`
- `audience`
- `last_updated`

# Regras obrigatórias

- o front matter deve estar completo antes de o documento ser considerado válido;
- `status` deve usar somente valores aprovados pelo projeto;
- `audience` deve usar somente audiências aprovadas pelo projeto;
- `version` deve usar formato semântico `MAJOR.MINOR.PATCH`;
- `last_updated` deve usar formato `YYYY-MM-DD`;
- campos adicionais podem existir, desde que não contradigam o padrão base.
