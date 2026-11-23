---
doc_id: HDS-DOCS-TEMPLATES-TEMPLATE-API-ENDPOINT
title: Template — api endpoint
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

# Guia de Estilo da Documentação de API

Aqui padronizamos e adicionamos requisitos de qualidade (auth, idempotência, cache, exemplos).

## Template de endpoint

## `<MÉTODO> <PATH>`
- **Doc ID:** `API-XXX`
- **OpenAPI:** `docs/tech/api/openapi.yml#/paths/...`
- **Descrição:** ...
- **Auth:** (nenhuma|JWT|OAuth2) + escopos
- **Rate limit:** ...
- **Idempotência:** ...
- **Cache:** (cacheável? TTL? Vary?)
- **Request**
  - Headers:
  - Query params:
  - Path params:
  - Body schema:
- **Respostas**
  - `200`: ...
  - `4xx`: ...
  - `5xx`: ...
- **Exemplos**
  - Request:
  - Response sucesso:
  - Response erro:
