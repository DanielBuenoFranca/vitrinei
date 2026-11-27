# Plano: IA / Vini

Objetivo: lançar o Vini em **texto** na v1 (D05), com custo controlado e sem abrir as funções de IA ao público.

## Estado atual

- **Fluxo:** `ViniHome`/`Landing` chamam a edge function `ai-router`. Ela roda primeiro o motor determinístico (`_shared/intentEngine`, que cruza a mensagem com o estoque real) e só chama o modelo de linguagem se a confiança ficar abaixo de 0,6. `vini-chat` conduz a conversa e `vini-brain-learn` registra padrões.
- **Controle de custo:** `_shared/aiCredits` tem um interruptor global (`getAiMode`, modo `off`) e registra economia em `ai_savings_log` e `ai_savings_periods`. Painel de governança no `/admin`.
- **Voz:** apenas entrada por reconhecimento de fala no navegador (`useSpeechRecognition`).
- **Dependência:** 12 funções chamam o gateway de IA do Lovable com `LOVABLE_API_KEY`.
- **Problemas:** as funções de IA e imagem não identificam o usuário nem limitam o uso; `vini-chat` repassa mensagens do cliente (inclusive com papel de sistema) ao modelo; um 402/429 desliga a IA para todos.

## Plano

1. **Autenticação e limite** (depende de `seguranca.md`): `_shared/auth.ts` e `_shared/rateLimit.ts` aplicados às funções de IA; `vini-chat` ignora papel `system` vindo do cliente e limita o tamanho da entrada.
2. **Teto de uso:** mensagens por usuário por dia e teto mensal global. Decisão A07: o valor do orçamento.
3. **Medição:** durante 2 a 4 semanas, medir consumo real em `ai_savings_log` e então fixar o orçamento.
4. **Modo econômico por padrão:** motor determinístico primeiro; modelo só quando necessário.
5. **Escopo da v1:** só texto e só produtos (D02); o catálogo de serviços não entra nas respostas.
6. **Camada única de modelo** (`_shared/llm.ts`): provedor, URL e modelo por variável de ambiente, para sair da dependência do gateway do Lovable (decisão A10) sem reescrever as 12 funções.
7. **Funções de imagem** (`sanitize-images`, `fetch-free-image`, `bulk-generate-catalog-images`, `generate-provider-logo`): exigir usuário e dono do item antes de gravar.

## Perguntas ao Daniel
- Quanto de crédito de IA o projeto consome hoje e quanto ele paga?
- Aceita migrar o provedor de IA para uma conta própria?
- **A14:** hoje o código orienta o Vini a nunca dizer que é uma IA (`src/lib/viniBrain.ts`). Isso é uma regra de produto que precisa da confirmação dele, com o jurídico. Este documento não afirma nada sobre o que a lei exige.

## Verificação
- Chamada sem login às funções de IA é recusada.
- Passar do limite diário devolve erro claro, sem derrubar a IA para os demais usuários.
- Com o modo `off`, o Vini continua respondendo pelo motor determinístico.
- O consumo medido aparece em `ai_savings_log` por período.

## Depende de
`seguranca.md` (passo 6); A07 e A10.
