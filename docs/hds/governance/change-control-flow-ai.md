---
doc_id: HDS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW-AI
title: Fluxo de Controle de Mudanças do hDS — Estrutura para IA
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW-HUMAN
- HDS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY-AI
- HDS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING-AI
tags:
- hds
document_type: guide
pair_required: true
pair_role: ai
pair_doc_id: HDS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW-HUMAN
topic_id: OS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW
---

# Objetivo

Definir o fluxo operacional de mudança para que agentes consigam classificar, atualizar, validar e encaminhar alterações sem quebrar o padrão hDS.

# Escopo

Aplica-se a mudanças em documentação viva, governança do hDS, templates, scripts, validações, migrações e exemplos.

# Entidades

## change_request

Pedido de mudança contendo problema, solução, escopo, classificação de impacto, compatibilidade e documentos afetados.

## author

Entidade que produz a mudança.

## reviewer

Entidade que verifica aderência, consistência e impacto.

## area_owner

Função responsável pela área afetada. Pode ser pessoa, time ou grupo.

## governance_approver

Função necessária quando a mudança altera política, estrutura, convenção ou semântica global do sistema.

# Pré-condições

- branch principal protegida conforme política local;
- validação local disponível;
- `.hds/config.yml` lido;
- `GUARDRAILS.md` lido;
- audiência correta identificada.

# Fluxo padrão

## 1. identificar necessidade

Extrair:

- problema atual;
- resultado desejado;
- documentos afetados;
- audiências afetadas;
- necessidade de par humano/IA;
- impacto em SemVer.

## 2. classificar mudança

Campos mínimos:

- `change_type`: editorial | operacional | governança | estrutural | migração | release
- `impact_level`: baixo | moderado | alto
- `compatibility`: compatível | incompatível
- `scope`: local | multiárea | sistêmico
- `semver_candidate`: none | patch | minor | major

## 3. criar branch

Criar branch dedicada com nome semântico.

## 4. atualizar documentação

Regras:

- manter idioma correto;
- manter front matter completo;
- atualizar `version` e `last_updated` quando aplicável;
- atualizar par humano/IA quando obrigatório;
- não misturar legado e documentação viva.

## 5. validar localmente

Executar:

```bash
bash scripts/run_all_checks.sh
```

Verificações lógicas adicionais:

- documentos referenciados existem;
- pares humano/IA estão coerentes;
- classificação SemVer é consistente com o impacto;
- `CHANGELOG.md` e `VERSION` foram atualizados quando requerido.

## 6. abrir PR ou MR

Campos mínimos da descrição:

- problema;
- solução;
- documentos alterados;
- audiências impactadas;
- semver;
- risco;
- necessidade de migração;
- checklist de validação.

## 7. revisão

Checklist mínimo:

- aderência ao hDS;
- clareza;
- audiência correta;
- coerência entre documentos relacionados;
- coerência entre documento humano e IA;
- compatibilidade declarada correta;
- evidência ou justificativa suficiente.

## 8. aprovação

Política mínima por tipo:

- editorial baixo impacto: revisor de conteúdo ou dono da área;
- operacional: dono da área + revisor adequado;
- governança ou breaking: dono da área + aprovador de governança.

## 9. merge

Executar merge apenas com validação aprovada e revisões concluídas.

## 10. pós-merge

Confirmar:

- estado válido da branch principal;
- versionamento coerente;
- changelog atualizado;
- necessidade de tag ou release.

# Fluxos especiais

## urgent_fix

Usar somente quando erro crítico compromete entendimento, operação ou risco. Exige revisão posterior registrada caso a revisão anterior tenha sido reduzida.

## legacy_migration

Passos obrigatórios:

1. copiar legado para `legacy-documentation/`;
2. registrar origem;
3. criar documentação viva correspondente;
4. relacionar legado e documentação nova;
5. marcar fonte de verdade atual.

## breaking_change

Passos obrigatórios:

1. justificar quebra;
2. identificar consumidores impactados;
3. descrever adaptação necessária;
4. atualizar versão major;
5. registrar no changelog;
6. comunicar mudança.

# Regras decisórias

## quando usar commit direto

Permitido apenas em contexto local, pessoal ou experimental, para mudança realmente pequena. Em repositório compartilhado, o padrão preferencial é branch + PR/MR.

## quando exigir par humano/IA

Exigir quando a mudança envolve:

- regra de negócio;
- fluxo operacional;
- decisão interpretativa;
- instrução reutilizável por agente.

## quando exigir governança adicional

Exigir quando a mudança altera:

- taxonomia documental;
- convenção de nomes;
- política de front matter;
- política de SemVer;
- fluxo de revisão/merge/release.

# Saídas esperadas

- branch criada;
- documentos atualizados;
- validação executada;
- PR/MR aberto com classificação adequada;
- aprovação correta obtida;
- merge realizado de forma rastreável.
