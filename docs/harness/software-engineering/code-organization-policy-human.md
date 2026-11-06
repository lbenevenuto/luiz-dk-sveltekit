---
doc_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-CODE-ORGANIZATION-POLICY-HUMAN-MD
title: Code Organization Policy — Human
version: 1.2.2
status: review
owner: hyst / Marcelo Moreira
lang: pt-BR
audience: tech
last_updated: '2026-10-12'
tags:
- agentic-os
document_type: guide
pair_required: true
pair_role: human
pair_doc_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-CODE-ORGANIZATION-POLICY-AI-MD
topic_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-CODE-ORGANIZATION-POLICY
---

# Code Organization Policy — Human

## Finalidade

Este documento define um padrão operacional para que projetos iniciados com o hyst Agentic Harness produzam software reutilizável, seguro, testável e compreensível por humanos e agentes. O objetivo não é criar burocracia: é criar alavanca de engenharia. Um FDE de alto nível precisa transformar contexto ambíguo de cliente em um sistema confiável, com decisões rastreáveis e código que possa evoluir sem depender da memória de uma conversa, de um único desenvolvedor ou de um agente específico.

A regra central é simples: todo código novo deve nascer de uma intenção clara, de um contrato verificável e de uma estrutura que preserve domínio, segurança, performance e manutenção. O agente deve preferir reutilizar, estender e compor antes de duplicar. Quando criar abstrações, deve justificar por que elas reduzem risco ou aumentam clareza. Quando evitar abstrações, deve justificar por que a solução simples preserva melhor entendimento e desempenho.

## Política

Organize código por fronteiras de responsabilidade. Em aplicações maiores, prefira camadas explícitas: domain, application/use-cases, infrastructure/adapters, interface/api/ui e shared quando realmente compartilhado. Evite pastas `utils` ou `common` que concentram lógica sem semântica. Cada arquivo deve ter motivo claro para existir.

O limite preferencial é 300 linhas. Até 500 linhas é aceitável quando separar o arquivo prejudicar entendimento de uma regra coesa, espalhar validações sensíveis, criar acoplamento circular ou fragmentar uma unidade semântica. Arquivo de código novo ou editado acima de 500 linhas falha: refatore antes do commit. Decisão, plano ou waiver local não substituem conformidade. Dívida legada intocada entra na fila e não bloqueia mudanças independentes. Não divida código apenas para satisfazer número; divida para melhorar navegação, teste, segurança e evolução. Componentes ou services que crescem devem ser separados por subresponsabilidades reais: parser, validator, mapper, policy, repository, presenter, hook, adapter ou contract.

## Como aplicar em projetos de cliente

Em projetos FDE, a pressão por velocidade é alta. Mesmo assim, velocidade sem harness gera retrabalho, incidentes e perda de confiança. Antes de implementar, o responsável deve identificar se a mudança envolve domínio, integração, dados sensíveis, autenticação, autorização, multi-tenancy, performance, UX crítica ou operação em produção. Se qualquer um desses pontos aparecer, o contrato de implementação precisa declarar riscos, alternativas consideradas, validações obrigatórias e documentação a ser atualizada.

O agente implementador deve consultar `AGENTS.md`, `GUARDRAILS.md`, `.agentic-harness/config.yml`, o contrato ativo e os documentos de software engineering aplicáveis. Ele deve trabalhar por progressive disclosure: carregar a política exata necessária, não todo o repositório. O agente validador deve verificar se a solução respeita esta política e deve registrar evidências em `AGENT_VALIDATION.md`.

## Critérios de aceite

Uma mudança está aceitável quando o código é claro, reduz duplicação relevante, mantém coesão, respeita fronteiras arquiteturais, possui testes proporcionais ao risco, registra decisões relevantes e não degrada segurança, performance ou operabilidade. Não basta compilar. O padrão exige que outro engenheiro ou agente consiga entender a intenção, a decomposição e o caminho de evolução.

Documentação associada deve ser substantiva. Um arquivo hDS válido não é um enfeite; ele deve explicar contexto, decisão, impacto, restrições e uso operacional. Se a documentação não ajudaria outro agente a continuar o trabalho, ela é rasa e deve ser rejeitada.

## Sinais de alerta

Sinais de alerta incluem helpers genéricos demais, classes sem responsabilidade clara, arquivos divididos apenas para cumprir número de linhas, services com muitas responsabilidades, abstrações criadas antes de existir variação real, dependências novas sem justificativa, código que acessa dados de tenant sem isolamento explícito, erros sem padronização, logs com dados sensíveis, testes ausentes em fluxo crítico e PRs que misturam refatoração ampla com entrega funcional.

Quando um desses sinais aparecer, o agente deve parar, registrar blocker ou decisão e propor alternativa menor e verificável. O objetivo é superar expectativa do cliente pela consistência da entrega: menos surpresa, menos regressão, mais clareza, mais segurança e maior capacidade de evolução.

## Evidência obrigatória por mudança

Cada unidade alterada exige `engineering_evidence` conforme `docs/ENGINEERING_EVIDENCE_STANDARD.md`: investigação do repositório com resultados, contratos consultados, decisão de reutilizar/estender/consolidar/criar/remover, revisão de responsabilidades e abstrações, análise de duplicação, causa raiz ou necessidade e validações executadas. Artefatos e fontes são vinculados por hashes. Evidência ausente, desatualizada, com placeholders ou validação falha bloqueia a entrega. Para código acima de 300 linhas, registre revisão de coesão. O gate verifica rastreabilidade; não certifica a verdade das decisões.
