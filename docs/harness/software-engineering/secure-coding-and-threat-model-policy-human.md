---
doc_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-SECURE-CODING-AND-THREAT-MODEL-POLICY-HUMAN-MD
title: Secure Coding and Threat Model Policy — Human
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
pair_doc_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-SECURE-CODING-AND-THREAT-MODEL-POLICY-AI-MD
topic_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-SECURE-CODING-AND-THREAT-MODEL-POLICY
---

# Secure Coding and Threat Model Policy — Human

## Finalidade

Este documento define um padrão operacional para que projetos iniciados com o hyst Agentic Harness produzam software reutilizável, seguro, testável e compreensível por humanos e agentes. O objetivo não é criar burocracia: é criar alavanca de engenharia. Um FDE de alto nível precisa transformar contexto ambíguo de cliente em um sistema confiável, com decisões rastreáveis e código que possa evoluir sem depender da memória de uma conversa, de um único desenvolvedor ou de um agente específico.

A regra central é simples: todo código novo deve nascer de uma intenção clara, de um contrato verificável e de uma estrutura que preserve domínio, segurança, performance e manutenção. O agente deve preferir reutilizar, estender e compor antes de duplicar. Quando criar abstrações, deve justificar por que elas reduzem risco ou aumentam clareza. Quando evitar abstrações, deve justificar por que a solução simples preserva melhor entendimento e desempenho.

## Política

Toda mudança sensível deve considerar ameaças antes de implementação: spoofing, tampering, repudiation, information disclosure, denial of service e elevation of privilege. O agente deve validar entradas, codificar saídas, proteger secrets, aplicar least privilege, autenticar e autorizar no backend, preservar tenant isolation, usar criptografia adequada e evitar logs com dados sensíveis.

Funcionalidades de suporte, impersonation, webhooks, APIs externas, uploads, download de evidência, processamento de arquivos e automações com agentes exigem trilha de auditoria. Mudanças que enfraquecem segurança devem ser recusadas ou escaladas. Banking-grade security significa que a solução deve sobreviver a auditoria técnica, não apenas funcionar em demo.

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
