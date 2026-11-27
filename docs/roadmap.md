# Roadmap: frentes e planos de ação

Visão única das frentes de trabalho. Nada abaixo foi iniciado. Sem estimativas de prazo: elas dependem dos acessos e das decisões em aberto (`decisoes.md`).

## Ordem geral

| Ordem | Frente | Depende de | Toca em dinheiro? | Status |
|---|---|---|---|---|
| 0 | Fundação | acesso ao repositório e ao Supabase (Daniel) | não | não iniciado |
| 1 | Segurança | Fase 0 | sim | não iniciado |
| 1 | Organização do código (higiene e tooling) | git | não | não iniciado |
| 2 | Comercial: pedidos, pagamento e entrega | Fase 1 e decisão A01 | sim | não iniciado |
| 2 | Afiliados, assinaturas e cashback | A03, A04, A09 | sim | não iniciado |
| 3 | IA / Vini | Fase 1 (autenticação nas funções) e A07 | não | não iniciado |
| 4 | Qualidade e mobile (testes, CI, PWA) | telas novas prontas | não | não iniciado |
| 5 | Independência do Lovable | A10 | não | não iniciado |
| — | Design system (Impeccable) | início definido pelo dev | não | **adiado, não iniciar** (D09) |
| — | Jurídico e fiscal | — | não | em paralelo, aguardando contador/jurídico |

## Frentes

### Fase 0: Fundação
- **Objetivo:** ter base segura para trabalhar.
- **Entregas:** repositório git (o GitHub sincronizado com o Lovable), `.gitignore` com `.env`, `.env.example`, ambiente de staging separado de produção, baseline de `npm ci`, `lint` e `build`.
- **Responsável:** a definir. **Pedido ao Daniel:** ver `resumo-para-daniel.md`.

### Segurança
- **Objetivo:** corrigir os pontos de segurança que precisam estar resolvidos antes de lançar com dinheiro e usuários reais.
- **Plano:** `planos/seguranca.md`.

### Comercial: pedidos, pagamento e entrega
- **Objetivo:** vender de verdade na v1 (Franca-SP, só produtos).
- **Plano:** `planos/comercial-pedidos-pagamento-entrega.md`; gateway em `comparativo-gateways.md`.

### Afiliados, assinaturas e cashback
- **Objetivo:** indicação simples e assinaturas cobradas de verdade, com regras claras.
- **Plano:** `planos/afiliados-assinaturas-cashback.md`.

### IA / Vini
- **Objetivo:** Vini em texto, com custo controlado.
- **Plano:** `planos/ia-vini.md`.

### Organização do código e design system
- **Objetivo:** estrutura por feature, camada de dados, testes, CI e tokens de design.
- **Plano:** `plano-organizacao-codigo.md`. A parte B (Impeccable) está **adiada**; a parte A só avança nas frentes que não tocam em dinheiro.

### Independência do Lovable
- **Objetivo:** reduzir a dependência de ferramentas de prototipação (requisito §23).
- **Entregas:** camada única de LLM com provedor configurável, login Google direto no Supabase, remoção dos pacotes Lovable, URLs por variável. Detalhes em `plano-organizacao-codigo.md` e `planos/ia-vini.md`.

### Jurídico e fiscal
- **Objetivo:** validar custódia do dinheiro, comissões de indicação e tributação antes de pagar comissão ou reter valores.
- **Não há parecer validado.** Decisões A08 e A09.
