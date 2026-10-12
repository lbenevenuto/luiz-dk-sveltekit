---
doc_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-DATA-PRIVACY-AND-TENANT-ISOLATION-POLICY-AI-MD
title: Data Privacy and Tenant Isolation Policy — AI
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
pair_doc_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-DATA-PRIVACY-AND-TENANT-ISOLATION-POLICY-HUMAN-MD
topic_id: OS-DOCS-HARNESS-SOFTWARE-ENGINEERING-DATA-PRIVACY-AND-TENANT-ISOLATION-POLICY
---

# Data Privacy and Tenant Isolation Policy — AI — AI Operating Notes

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

Dados pessoais, dados sensíveis, evidências, documentos, logs e dados de tenant devem ser tratados com isolamento, minimização e rastreabilidade. Em sistemas multi-tenant, a fronteira de tenant deve ser imposta no backend, preferencialmente por contexto autenticado e controles de banco/infraestrutura quando disponíveis. Nunca confie em tenant id enviado livremente pelo frontend.

Logs devem mascarar dados pessoais e secrets. Exports devem respeitar autorização e finalidade. Retenção deve ser configurável quando o produto exigir. Dados usados por agentes ou MCPs devem seguir autorização explícita e princípio de menor privilégio. Qualquer automação que consulte banco, logs, Jira, GitHub, Confluence ou analytics precisa registrar fonte, escopo e justificativa quando envolver informação de cliente.

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
