---
doc_id: HDS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW-HUMAN
title: Fluxo de Controle de Mudanças do hDS — Visão Humana
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: manager
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW-AI
- HDS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY-HUMAN
- HDS-DOCS-HDS-OPERATIONS-SCM-PLATFORM-MAPPING-HUMAN
tags:
- hds
document_type: guide
pair_required: true
pair_role: human
pair_doc_id: HDS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW-AI
topic_id: OS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW
---

# Resumo executivo

Este documento descreve, de ponta a ponta, como uma mudança deve nascer, ser documentada, revisada, aprovada, mesclada e liberada em um repositório que usa hDS. O objetivo é impedir mudanças opacas, documentação inconsistente, quebra de governança e perda de rastreabilidade.

# Objetivo

Padronizar o fluxo de controle de mudanças para documentação viva e para o próprio padrão hDS, independentemente da plataforma de hospedagem de Git.

# Princípios do fluxo

Toda mudança relevante deve ser rastreável, revisável, compreensível e classificada por impacto. O fluxo deve ser forte o bastante para governar mudanças importantes e simples o bastante para não travar o trabalho normal.

# Papéis no fluxo

## Autor da mudança

É quem propõe a alteração. Deve entender o impacto, classificar a mudança, atualizar a documentação necessária, executar validações e abrir a solicitação de revisão.

## Revisor de conteúdo

Avalia clareza, completude, aderência ao hDS, consistência entre documentos e adequação da audiência.

## Dono da área

Responde pela área afetada. Pode ser um papel, uma função, um grupo ou um time. O hDS não depende de um usuário individual; depende de responsabilidade explícita.

## Aprovador de governança

Atua quando a mudança altera políticas, convenções, versionamento, estrutura do hDS ou regras que afetam múltiplos projetos.

## Responsável por release

Quando houver processo de release formal, é quem garante atualização de `VERSION`, `CHANGELOG.md`, tags e comunicação da mudança.

# Quando uma mudança pode ser feita

## Mudança pequena local

Uma correção pontual de clareza, ortografia, link interno quebrado ou ajuste editorial sem impacto de interpretação pode seguir fluxo leve, mas ainda deve ser validada e registrada.

## Mudança operacional relevante

Qualquer alteração que afete uso do sistema, forma de documentar, runbooks, regras, estrutura, templates, validações, automações ou leitura por agentes deve passar por revisão formal.

## Mudança estrutural ou breaking

Toda alteração incompatível com a forma anterior de uso do hDS, ou que exija adaptação dos consumidores, deve ser tratada como mudança maior, com documentação explícita de impacto e versionamento apropriado.

# Fluxo padrão de mudança

## 1. Identificação da necessidade

A mudança nasce de uma necessidade concreta: correção, novo padrão, melhoria, migração, aprendizado operacional, exigência de auditoria ou evolução da governança.

O autor deve responder no mínimo:

- qual problema atual existe;
- qual comportamento desejado;
- quais documentos e audiências serão afetados;
- se a mudança afeta pessoas, agentes ou ambos;
- se há impacto de SemVer.

## 2. Classificação inicial

A mudança deve ser classificada em uma ou mais dimensões:

- tipo: editorial, operacional, governança, estrutural, migração, release;
- impacto: baixo, moderado, alto;
- compatibilidade: compatível ou incompatível;
- escopo: local, multiárea, sistêmico.

## 3. Criação de branch

A prática recomendada é criar uma branch dedicada. Exemplos:

- `docs/fix-links-readme`
- `governance/add-pr-flow`
- `migration/project-x-initial-hds`
- `breaking/restructure-doc-taxonomy`

Nomes devem refletir o propósito da mudança.

## 4. Atualização documental

O autor atualiza os documentos necessários. Regras obrigatórias:

- manter o idioma correto;
- manter front matter completo;
- atualizar versão e data quando aplicável;
- atualizar ambos os documentos quando houver pareamento humano + IA;
- preservar a diferença entre `tech`, `manager` e `c-level`.

## 5. Validação local

Antes de pedir revisão, o autor deve no mínimo:

- executar `bash scripts/run_all_checks.sh`;
- revisar links e referências cruzadas;
- conferir se o par humano/IA continua coerente;
- conferir se a classificação de SemVer está correta.

## 6. Abertura de PR ou MR

A mudança deve ser apresentada com contexto suficiente para revisão. A descrição deve explicar:

- problema atual;
- solução proposta;
- documentos alterados;
- impacto em audiência;
- necessidade ou não de migração;
- classificação SemVer;
- riscos e pontos de atenção.

## 7. Revisão

A revisão não deve ser só sintática. O revisor deve verificar:

- se o problema foi corretamente entendido;
- se a documentação está clara;
- se a audiência está correta;
- se a mudança introduz conflito com docs existentes;
- se o par humano/IA é necessário e está consistente;
- se a alteração exige atualização de `CHANGELOG.md` ou `VERSION`.

## 8. Aprovação

A aprovação mínima depende do tipo de mudança.

### Mudança editorial de baixo impacto

Pode exigir apenas um revisor de conteúdo ou o dono da área, conforme política do projeto.

### Mudança operacional

Deve envolver pelo menos o dono da área e um revisor que conheça o uso prático da documentação.

### Mudança de governança ou breaking

Deve envolver aprovação de governança, além da revisão normal.

## 9. Merge

Após aprovação e validação, a mudança é mesclada conforme a estratégia do projeto. A política recomendada é manter histórico legível, evitando merges sem contexto.

## 10. Pós-merge

Depois do merge, a equipe deve confirmar:

- se a branch principal está válida;
- se os docs canônicos estão coerentes;
- se houve atualização de changelog e versão quando necessário;
- se release ou comunicação adicional é necessária.

# Fluxos especiais

## Correção urgente

Quando há erro crítico que afeta entendimento, operação ou risco, uma correção urgente pode seguir fluxo acelerado, mas nunca sem revisão mínima posterior. O repositório não deve aceitar a lógica de “corrigir agora e esquecer a governança depois”.

## Migração de legado

Migração não é copiar arquivos de qualquer forma. O fluxo mínimo é:

1. copiar o legado para `legacy-documentation/`;
2. registrar origem e contexto;
3. produzir a nova documentação viva;
4. cruzar referências entre legado e novo estado quando fizer sentido;
5. marcar claramente qual é a fonte de verdade atual.

## Mudança breaking

Mudança breaking exige:

- justificativa explícita;
- descrição do que quebra;
- descrição de quem será impactado;
- plano de adaptação;
- atualização major de versão;
- changelog claro;
- comunicação proporcional ao impacto.

# Quando commit direto é aceitável

Em repositórios pessoais, experimentais ou em fase inicial, um commit direto pode ser tolerado para ajustes pequenos. Em repositórios compartilhados, o padrão recomendado do hDS é usar branch + PR/MR para qualquer alteração relevante.

O fluxo não deve ser dogmático, mas também não pode ser frouxo a ponto de perder auditoria.

# Matriz de decisão simplificada

## Ajuste editorial simples

- branch dedicada recomendada;
- revisão leve;
- SemVer geralmente `patch` ou nenhuma mudança de versão, conforme política local.

## Nova documentação compatível

- branch dedicada;
- revisão formal;
- `minor` se ampliar capacidade do sistema sem quebrar compatibilidade.

## Mudança em governança

- branch dedicada;
- revisão formal + aprovação de governança;
- `minor` ou `major`, conforme impacto.

## Mudança incompatível

- branch dedicada;
- revisão ampliada;
- plano de adaptação;
- `major`.

# O que o fluxo evita

- documentos contraditórios;
- mudança sem dono;
- regra sem explicação;
- material legado competindo com documentação viva;
- quebra silenciosa do padrão;
- alterações difíceis de auditar.

# Referências

- `docs/hds/governance/pr-merge-semver-policy-human.md`
- `docs/hds/operations/scm-platform-mapping-human.md`
- `docs/hds/operations/github-settings-checklist-human.md`
