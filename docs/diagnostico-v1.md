# Diagnóstico: ideias (`conversas-e-ideias`) vs. o que já existe no código

Base: `docs/conversas-e-ideias` (visão completa + recorte da 1ª versão) comparado com `src/`, `supabase/migrations/` e `supabase/functions/`.

> O escopo da v1 foi refinado na conversa de 26/11/2026 (piloto em Franca-SP, só produtos, indicação simples). Ver `mapa-da-ideia.md` e `decisoes.md`. Os fatos sobre o código abaixo não mudaram.

## Recorte da v1 pedido
Produtores de alimentos, congelados e itens simples vendendo de forma fácil, com opção de entrega facilitada por entregador. Escopo: Cliente (e-commerce + financeiro), Fornecedor (e-commerce + financeiro), Assistente IA (texto), Financeiro (cashback, extrato, adm) e Rede de afiliados (assinaturas, afiliados).

## O que já existe

| Escopo v1 | Status | Evidência |
|---|---|---|
| Assistente IA (texto) | Existe | `ViniHome`/`Landing` → edge `ai-router` (motor determinístico antes do LLM), `vini-chat`, `vini_conversations`, toggle `getAiMode`, voz de entrada `useSpeechRecognition` |
| Cliente: catálogo de produtos/serviços | Existe | `dynamic_products`, `dynamic_services`, `segments`, `kits`; rotas `/client`, `/buscar`, `/loja/:slug` |
| Fornecedor: vitrine + gestão | Existe | `/mei`, `stock_*`, `providers`, `storefront-ai-designer`, `/importar` |
| Financeiro / carteira / extrato | Existe (saldo interno) | `wallets`, `wallet_transactions`, `WalletPage`, `process_sale_split` (1% comprador + 1% vendedor), `process_checkout_acid`, `contract_credit` |
| Cashback | Existe | `release_referral_cashback`, `release_fractioned_cashback`, `release_referral_phase` |
| Assinaturas | Existe | `subscriptions`, `SubscriptionPage`, planos Bronze R$50 / Prata R$100 / Ouro R$200 (`useSubscriptionPlans`, sobrescritos por `site_settings`) |
| Afiliados / indicações | Base existe | `referrals`, `referral_campaigns`, `/convite/:code`; falta rede de representantes, extrato de comissão e parecer jurídico |
| Admin | Existe | `/admin`: usuários, CRM, leads, cardex, governança de IA, import |
| Avaliações | Parcial | `provider_ratings` |
| Geolocalização | Parcial | `profiles.latitude/longitude`, mapa Leaflet; filtro "perto de mim" não confirmado |

## O que falta para a v1

| Item | Status | Evidência |
|---|---|---|
| Entrega por entregador | Só demonstração | `RadarUrgencyFlow` + `DeliveryMap` com entregador fictício e PIN simulado; sem tabela de entregas |
| Pedidos (ciclo completo) | Falta | sem tabela `orders`/status |
| Pagamento real (Pix/cartão) | Falta | sem gateway; "QR Code Pix" no `CartBar` é só interface |
| Chat cliente↔fornecedor e notificações | Falta | só há conversa com o Vini |
| Mobile-first | A validar | stack responsiva, mas admin/demos são desktop |

## Pontos de atenção
- `supabase/functions/process-sale` existe, mas nenhum `functions.invoke('process-sale')` aparece em `src/`. Confirmar o checkout real antes de lançar.
- `ViniHome.tsx` e `AdminPanel.tsx` são arquivos muito grandes (candidatos a quebra).
- O requisito pede independência de ferramentas de prototipação; hoje o projeto depende do Lovable (gateway de IA e `integrations/` gerados).

## Perguntas do dono do produto
- **IA na v1?** Viável: já está no código, com camada determinística que evita custo de LLM e toggle `off`. Recomendado: só texto, modo econômico por padrão, limite por usuário.
- **Quanto custa?** Não dá para cravar valor só pelo código. Depende de volume de mensagens, modelo usado pelo gateway Lovable e plano Supabase/hospedagem. O código tem controles de medição (`ai_savings_log`, `ai_savings_periods`). Gateway de pagamento cobra taxa por transação.
- **Menor caminho para a v1 de alimentos + entrega:**
  1. integrar um gateway Pix;
  2. criar `orders` com status, ligada ao split existente;
  3. campo retirada / entrega própria / entregador (começar via WhatsApp);
  4. notificação de novo pedido ao fornecedor.
