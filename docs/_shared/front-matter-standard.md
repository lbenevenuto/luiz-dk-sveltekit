---
doc_id: HDS-DOCS-SHARED-FRONT-MATTER-STANDARD
title: Contrato canônico de metadados
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

# Contrato canônico de metadados

Todos os Markdown governados, inclusive políticas, templates, exemplos e arquivos raiz, possuem YAML front matter.

| Campo | Contrato |
|---|---|
| `doc_id` | Identidade estável e única; não muda quando o arquivo é movido. |
| `title` | Título explícito e não vazio. |
| `version` | SemVer numérico `MAJOR.MINOR.PATCH`, sem zeros à esquerda. |
| `status` | `draft`, `review`, `approved` ou `deprecated`. |
| `owner` | Pessoa, função ou equipe responsável; nenhum owner fictício em documento aprovado. |
| `lang` | Idioma no formato BCP 47, por padrão `pt-BR`. |
| `audience` | Uma audiência primária: `tech`, `manager` ou `c-level`. |
| `last_updated` | Data real `YYYY-MM-DD`, sem data futura. |
| `tags` | Lista não vazia de termos. |
| `document_type` | `guide`, `policy`, `business_rule`, `process`, `adr`, `rfc`, `runbook`, `template`, `example` ou `record` ou `technical`. |
| `pair_required` | Booleano; obrigatório para `business_rule`, `process` e `technical`. |

## Pareamento

Quando `pair_required: true`, informar `pair_role: human` ou `ai`, `pair_doc_id` do complemento e `topic_id` comum. O vínculo deve ser recíproco. Ambos compartilham versão, data, status, owner e idioma. Os arquivos podem viver em diretórios diferentes.

`related_docs` referencia IDs existentes. `sources` pode listar evidências e fontes. `deprecated` exige `superseded_by` com ID válido e `deprecation_reason`.

## Templates e exemplos

Metadados dos modelos são válidos e os IDs identificam o modelo. Ao copiar, crie uma nova identidade para o documento real. Campos em aberto são permitidos somente em `draft`/`review`, com tipo `template` ou `example`; nunca representam evidência ou implementação. Nenhum placeholder é permitido em documento `approved`.

## Evolução

PATCH corrige sem mudar contrato; MINOR amplia com compatibilidade; MAJOR quebra o uso anterior. Conteúdo alterado exige versão maior que a do commit base, data não regressiva e revisão registrada. Mais de uma alteração no mesmo dia pode manter a data, com versão incrementada. IDs removidos devem aparecer no registro de revisão com ação `removed`.

## Documentação técnica

Use `document_type: technical` e um par explícito humano/IA. Documente contratos,
responsabilidades, invariantes, dependências, casos limite, erros e validação.
Mantenha regras de negócio em pares distintos; vincule a implementação às regras
canônicas. Nenhum documento constitui aprovação automática de código.
