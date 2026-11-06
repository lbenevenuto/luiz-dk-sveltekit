---
doc_id: HDS-POL-007
title: Política de Versionamento e SemVer do hDS
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

Definir quando e como mudanças no padrão hDS devem atualizar versionamento e changelog.

# Classificação mínima

- `patch`: correção compatível, ajuste editorial relevante ou melhoria sem quebra;
- `minor`: nova capacidade compatível, nova política ou ampliação do padrão sem incompatibilidade;
- `major`: mudança incompatível, quebra de convenção ou necessidade de adaptação dos consumidores.

# Regras obrigatórias

- mudanças no próprio padrão hDS devem atualizar `VERSION`;
- mudanças relevantes no padrão hDS devem registrar entrada correspondente em `CHANGELOG.md`;
- a classificação SemVer deve ser coerente com compatibilidade e impacto;
- não registrar mudança breaking como `patch` ou `minor`;
- quando houver dúvida relevante sobre impacto, tratar a classificação como tema explícito de revisão.
