---
doc_id: HDS-DOCS-TEMPLATES-TEMPLATE-ENVIRONMENT
title: Template — environment
version: 2.0.0
status: draft
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- hds
document_type: template
pair_required: false
---

> Modelo em draft: copie, atribua um novo doc_id e preencha somente com informação verificada. Remova campos inaplicáveis com justificativa.

# Variáveis de Ambiente


## Por que `.env`
- Centraliza configuração
- Separa código e config
- Portabilidade entre ambientes
- Segurança: não commitar segredos

## Tabela de variáveis
| Variável | Descrição | Exemplo | Obrigatória | Segredo |
|---|---|---|---:|---:|
| APP_ENV | Ambiente de execução | `development` | ✅ | ❌ |
| DB_HOST | Host do banco | `127.0.0.1` | ✅ | ❌ |
| JWT_SECRET | Segredo JWT | `***` | ✅ | ✅ |
