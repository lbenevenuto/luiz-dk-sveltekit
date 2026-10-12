---
doc_id: HDS-DOCS-HDS-CORE-DOCUMENT-CATALOG
title: Catálogo e cobertura documental
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- hds
document_type: guide
pair_required: false
---

# Catálogo e cobertura documental

| Tema | Modelos / destinos |
|---|---|
| Visão, personas e histórias | `docs/_templates/template-system-overview.md`, `template-personas.md`, `template-user-story.md` |
| Arquitetura e decisões | `template-architecture.md`, `template-adr.md`, `template-rfc.md`; decisões em `docs/tech/adrs/` |
| API | `template-api-endpoint.md`, `template-openapi.yml`; contrato real em `docs/tech/api/` |
| Dados | `template-data-model.md`, `template-data-dictionary.md` |
| Segurança e privacidade | `template-security-privacy.md` |
| Operação | `template-installation.md`, `template-environment.md`, `template-runbook.md` |
| Fontes e vocabulário | `template-bibliography.md`, `template-glossary.md` |
| Gestão e decisão executiva | `template-manager.md`, `template-c-level.md` |
| Regras pareadas | `template-human-ai-human.md`, `template-human-ai-ai.md`, `template-business-rules-pair.md` |

Os nomes abreviados da tabela são relativos a `docs/_templates/`. Os modelos não representam conteúdo implementado. O projeto seleciona os necessários e registra exclusões relevantes.

## Contratos de API

OpenAPI é a fonte canônica do contrato quando aplicável; o guia humano explica comportamento, autorização, idempotência, limites, cache e erros. O pacote não inclui uma API fictícia como se fosse real. A validação OpenAPI do consumidor deve usar ferramenta oficial adequada e não é substituída pelo YAML parser do hDS.

## Referências e não duplicação

Registre fontes externas em uma bibliografia do projeto, com título, organização, data de consulta e contexto. Linke o documento canônico em vez de replicar regras. Pares humano/IA mantêm o mesmo contrato por apresentações complementares.

## Implementação documentada

`docs/business/` contém regras de negócio e processos de produto, com origem,
condições, exceções e efeitos observáveis. `docs/tech/` contém a documentação de
módulos, classes, helpers, funções, procedimentos, interfaces e arquitetura.
Ambas possuem apresentações humanas e para IA, com links recíprocos. Uma unidade
coesa pode abranger vários arquivos; não crie documentos vazios por função.
