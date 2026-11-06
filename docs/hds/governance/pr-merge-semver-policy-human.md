---
doc_id: HDS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY-HUMAN
title: Política de Pull Request, Merge e Versionamento Semântico do hDS — Visão Humana
version: 2.0.0
status: review
owner: hDS Maintainers
lang: pt-BR
audience: manager
last_updated: '2026-10-12'
related_docs:
- HDS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY-AI
- HDS-DOCS-HDS-GOVERNANCE-CHANGE-CONTROL-FLOW-HUMAN
tags:
- hds
document_type: guide
pair_required: true
pair_role: human
pair_doc_id: HDS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY-AI
topic_id: OS-DOCS-HDS-GOVERNANCE-PR-MERGE-SEMVER-POLICY
---

# Objetivo

Definir como mudanças entram no repositório, como são revisadas, quando podem ser mescladas e como seu impacto deve ser refletido em versionamento semântico.

# Regra principal

Em repositórios compartilhados, a prática padrão do hDS é **branch + pull request ou merge request + revisão + merge rastreável**.

# Pull request e merge request

O hDS usa os termos PR e MR como equivalentes funcionais. O nome muda conforme a plataforma, mas a lógica de controle permanece a mesma.

# O que deve existir em uma solicitação de mudança

Uma solicitação madura deve conter:

- objetivo da mudança;
- problema resolvido;
- documentos afetados;
- audiência afetada;
- classificação SemVer proposta;
- riscos;
- necessidade de migração ou comunicação adicional.

# Tipos de merge recomendados

## Squash merge

Útil quando há muitos commits intermediários e se deseja preservar uma história principal mais limpa.

## Merge commit

Útil quando a equipe quer preservar a identidade completa da branch e sua revisão como unidade de mudança.

## Rebase and merge

Pode ser útil em equipes disciplinadas, mas exige cuidado para não dificultar auditoria para públicos menos experientes.

O hDS não impõe uma única estratégia universal. Ele exige que a escolha seja consistente, documentada e compreensível.

# Política de SemVer

## PATCH

Usar quando a mudança:

- corrige erro;
- melhora clareza;
- ajusta inconsistência;
- melhora instrução sem alterar o modelo conceitual;
- mantém compatibilidade com o uso anterior.

Exemplos:

- correção de texto que alterava entendimento;
- ajuste de template sem quebrar uso;
- melhoria de exemplo;
- correção de referência cruzada.

## MINOR

Usar quando a mudança:

- adiciona capacidade nova compatível;
- amplia cobertura documental;
- adiciona fluxo, runbook ou template sem invalidar o anterior;
- melhora governança sem quebrar consumidores existentes.

Exemplos:

- novo runbook de adoção;
- nova política complementar;
- novos exemplos operacionais;
- novo script opcional de apoio.

## MAJOR

Usar quando a mudança:

- quebra compatibilidade;
- muda taxonomia de pastas de forma incompatível;
- altera convenção de front matter obrigatória de forma não compatível;
- substitui fluxo anterior exigindo adaptação explícita;
- renomeia estruturas centrais com impacto em consumidores.

Exemplos:

- remoção de diretórios canônicos;
- mudança incompatível na forma de pareamento humano/IA;
- mudança que obriga projetos já aderentes a reescrever documentação.

# Quando não mudar versão

Algumas equipes aceitam alterações sem mudança de `VERSION` quando o impacto é puramente local ou ainda não liberado. Se essa política existir, ela deve ser explícita. Na ausência de regra local, o hDS prefere refletir mudanças relevantes com SemVer.

# Relação entre PR e SemVer

Toda solicitação de mudança deve declarar a classificação SemVer esperada, mesmo que provisória. A revisão pode concordar ou reclassificar.

# Quando atualizar CHANGELOG

Atualizar `CHANGELOG.md` quando a mudança for relevante para entendimento, adoção, operação, governança, compatibilidade ou migração.

# Critérios de aprovação por impacto

## Patch simples

Revisão proporcional. Normalmente um revisor adequado pode ser suficiente.

## Minor

Exige revisão funcional de quem entende a área impactada.

## Major

Exige revisão ampliada, aprovação explícita e documentação do impacto de adoção.

# Branch principal

A branch principal não deve receber mudanças relevantes sem revisão em repositórios compartilhados. O ideal é protegê-la com regras de revisão e checagens obrigatórias.

# Exceções

## Hotfix

Pode acelerar o caminho até o merge, mas não elimina a obrigação de registrar impacto, revisar e manter rastreabilidade.

## Repositório pessoal ou laboratório

Pode tolerar fluxo mais simples, desde que isso seja uma decisão consciente do contexto e não o padrão imposto a times.

# O que esta política evita

- merge sem contexto;
- atualização silenciosa de padrão;
- quebra incompatível sem aviso;
- changelog incompleto;
- versão que não representa o estado real.

## Contrato de evolução em 2.0.0

Toda alteração de conteúdo de documento exige incremento de sua versão e registro de revisão. Exceções de fluxo de PR não dispensam esses requisitos. A versão do padrão deve evoluir quando seu contrato, implementação ou modelos mudarem.
