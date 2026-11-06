---
doc_id: HDS-DOCS-HDS-CORE-REPOSITORY-STRUCTURE
title: Estrutura do Repositório hDS
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-CORE-HDS-OVERVIEW-HUMAN
tags:
- hds
document_type: guide
pair_required: false
---

# Estrutura e intenção

- `.hds/`: configuração e políticas do sistema.
- `docs/_templates/`: modelos canônicos.
- `docs/hds/`: documentação do próprio hDS usando o próprio hDS.
- `docs/tech/`: documentação técnica do projeto.
- `docs/manager/`: documentação gerencial.
- `docs/c-level/`: documentação executiva.
- `docs/human/`: documentos orientados a pessoas quando houver pareamento.
- `docs/ai/`: documentos orientados a agentes quando houver pareamento.
- `legacy-documentation/`: preservação histórica.
- `scripts/`: automações de bootstrap, migração e validação.

# Observação sobre convenções em inglês

Determinados nomes estruturais permanecem em inglês por padrão do sistema e não devem ser traduzidos automaticamente, inclusive quando o conteúdo do projeto estiver em pt-BR.
