---
doc_id: HDS-DOCS-HDS-GOVERNANCE-DOCUMENTATION-GOVERNANCE-AI
title: Governança Documental do hDS para IA
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-GOVERNANCE-DOCUMENTATION-GOVERNANCE-HUMAN
tags:
- hds
document_type: guide
pair_required: true
pair_role: ai
pair_doc_id: HDS-DOCS-HDS-GOVERNANCE-DOCUMENTATION-GOVERNANCE-HUMAN
topic_id: OS-DOCS-HDS-GOVERNANCE-DOCUMENTATION-GOVERNANCE
---

# Objetivo

Formalizar as regras de governança documental para execução por agentes.

# Controles mínimos

1. verificar front matter;
2. verificar audiência;
3. verificar idioma;
4. verificar necessidade de pareamento humano/IA;
5. verificar segregação de legado;
6. verificar atualização de versão e data.

# Condições de não conformidade

- documento vivo sem `owner`;
- documento vivo sem versão;
- regra de negócio sem documento IA correspondente;
- idioma inconsistente;
- documentação antiga fora de `legacy-documentation/` sem justificativa.
