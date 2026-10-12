---
doc_id: HDS-DOCS-HDS-CORE-HDS-OVERVIEW-AI
title: Especificação Estrutural do hDS para IA
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-CORE-HDS-OVERVIEW-HUMAN
- HDS-DOCS-HDS-GOVERNANCE-DOCUMENTATION-GOVERNANCE-AI
tags:
- hds
document_type: guide
pair_required: true
pair_role: ai
pair_doc_id: HDS-DOCS-HDS-CORE-HDS-OVERVIEW-HUMAN
topic_id: OS-DOCS-HDS-CORE-HDS-OVERVIEW
---

# Objetivo

Definir as regras operacionais do hDS em formato explícito para interpretação por agentes.

# Definições

- `documentação viva`: estado atual validado.
- `documentação legada`: material histórico preservado em `legacy-documentation/`.
- `par humano/IA`: dois documentos complementares sobre o mesmo assunto.

# Regras mandatórias

1. Ler `.hds/config.yml` antes de criar ou alterar documentos.
2. Respeitar `default_language` ou `lang` do arquivo.
3. Exigir front matter completo em documentos vivos.
4. Criar par humano/IA quando o tema servir aos dois públicos.
5. Criar par humano/IA quando houver regras de negócio, processo, explicação operacional ou lógica decisória.
6. Classificar audiência corretamente em `tech`, `manager` ou `c-level`.
7. Preservar legado em `legacy-documentation/`.
8. Atualizar `version` e `last_updated` em toda mudança relevante.
9. Manter identificadores estruturais em inglês quando fizerem parte do padrão oficial do sistema.

# Invariantes

- documentação viva não deve ser armazenada em `legacy-documentation/`;
- documento vivo deve conter front matter mínimo;
- regra de negócio compartilhada deve possuir par humano/IA;
- a audiência declarada deve refletir o propósito real do documento.
