---
doc_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-REUSE-AND-EXTENSION-POLICY-AI-MD
title: Reuse and Extension Policy — AI
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
pair_role: ai
pair_doc_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-REUSE-AND-EXTENSION-POLICY-HUMAN-MD
topic_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-REUSE-AND-EXTENSION-POLICY
---

# Reuse and Extension Policy — AI — AI Operating Notes

## Instrução operacional

Aplique esta política em qualquer alteração de código, arquitetura, documentação técnica, integrações, automações, agentes ou pipelines. O objetivo é garantir que o agente atue como um engenheiro sênior/FDE: entende contexto, preserva qualidade, evita duplicação, registra decisões e valida com sensores objetivos.

Antes de criar código novo, responda internamente:

1. Já existe implementação semelhante?
2. A mudança pertence ao domínio, aplicação, infraestrutura, UI ou operação?
3. A solução exige classe, função pura, service, adapter, factory, strategy, helper ou apenas configuração?
4. Há risco de segurança, dados sensíveis, tenant isolation, autenticação, autorização, performance ou custo?
5. Quais testes e sensores provam que a solução funciona?
6. Qual documentação hDS precisa mudar?

## Regras para execução

Antes de criar algo novo, o agente deve pesquisar implementações equivalentes e registrar se reutilizou, estendeu ou criou novo componente. Reuso não significa acoplar tudo; significa preservar conhecimento e reduzir variação acidental. Quando houver variação previsível por cliente, tenant, fornecedor, tipo de arquivo, regra fiscal, layout, canal, idioma ou integração, prefira extension points claros.

Use composition, strategy, adapter, factory, template method ou configuração quando houver motivo concreto. Evite herança profunda. Classes de extensão devem depender de interfaces pequenas e contratos testáveis. Se a extensão altera comportamento crítico, crie teste para a implementação base e para a variação. Se duplicação for temporária por segurança, registre dívida técnica e motivo. Duplicação silenciosa em projetos com agentes deve ser tratada como falha de harness.

## Padrão de saída esperado

Ao implementar, entregue código pequeno o suficiente para revisão e grande o suficiente para preservar semântica. Prefira arquivos até 300 linhas. Aceite até 500 linhas quando a coesão do domínio, a segurança, a performance ou a legibilidade forem prejudicadas por divisão artificial. Arquivo de código novo ou editado acima de 500 linhas falha: refatore antes do commit. Decisão, plano ou waiver local não substituem conformidade. Dívida legada intocada entra na fila e não bloqueia mudanças independentes.

Não crie helpers como gaveta de lógica. Não crie classe apenas para parecer enterprise. Não crie abstraction layer sem variação real, teste, contrato e benefício. Não divida código de forma que obrigue o leitor a navegar por cinco arquivos para entender uma única regra atômica. Não misture regra de negócio, transporte, persistência e apresentação no mesmo bloco.

## Validação obrigatória

Rode `bash scripts/run_all_checks.sh` quando a mudança afetar documentação, harness ou código. Quando houver projeto com stack específica, rode lint, typecheck, testes e build. Quando dependências mudarem, execute a política de dependências. Quando houver API, rode ou crie teste de contrato. Quando houver dados de cliente, valide isolamento, autorização, mascaramento e logs.

Registre o resultado em `.agentic-harness/state/AGENT_VALIDATION.md`. Se não houver comando objetivo disponível, registre a lacuna e proponha o sensor que deve ser criado. Nunca declare pronto apenas por inspeção textual.

## Continuidade

Atualize `AGENT_PROGRESS.md` com o que foi feito, `AGENT_DECISIONS.md` com decisões relevantes, `AGENT_BLOCKERS.md` com impedimentos e `AGENT_HANDOFF.md` com o estado final. O próximo agente deve conseguir continuar sem ler a conversa original.

## Evidência obrigatória por mudança

Cada unidade alterada exige `engineering_evidence` conforme `docs/ENGINEERING_EVIDENCE_STANDARD.md`: investigação do repositório com resultados, contratos consultados, decisão de reutilizar/estender/consolidar/criar/remover, revisão de responsabilidades e abstrações, análise de duplicação, causa raiz ou necessidade e validações executadas. Artefatos e fontes são vinculados por hashes. Evidência ausente, desatualizada, com placeholders ou validação falha bloqueia a entrega. Para código acima de 300 linhas, registre revisão de coesão. O gate verifica rastreabilidade; não certifica a verdade das decisões.
