---
doc_id: HDS-POL-006
title: Política de Idioma do hDS
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

Definir como o idioma dos documentos deve ser governado no hDS.

# Regras obrigatórias

- usar `default_language` de `.hds/config.yml` como idioma padrão do projeto;
- permitir sobrescrita somente por `lang` no front matter do documento;
- não alternar idioma dentro do mesmo documento sem necessidade explícita;
- manter nomes estruturais, chaves técnicas e caminhos estáveis quando isso fizer parte do padrão do sistema;
- preservar consistência terminológica entre documentos relacionados.
