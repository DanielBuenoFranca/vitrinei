# Plano: afiliados, assinaturas e cashback

Objetivo: na v1, **indicação simples** (D06), assinaturas definidas e cobradas de verdade e cashback com regra clara. **Há três decisões abertas**: cashback (A03), receita da v1 (A04) e regras e tributação das comissões (A09). Nenhum ponto jurídico ou tributário deste documento é validado.

## Estado atual

- **Indicações:** `referrals` e `referral_campaigns`, link de convite (`/convite/:code`), `ShareReferralModal`, `ReferralRulesModal`, e campanhas no `/admin` (`CampaignForm`). As recompensas são liberadas por fases pelas funções `release_referral_phase` e `release_fractioned_cashback`, com o valor definido num `reward_snapshot`.
- **Assinaturas:** `subscriptions`, `SubscriptionPage`, planos Bronze R$ 50, Prata R$ 100 e Ouro R$ 200 (valores padrão em `useSubscriptionPlans`, sobrescritos por `site_settings`). A cobrança real não existe: o preço vem do navegador e a ativação é feita sem pagamento confirmado.
- **Cashback:** `locked_cashback` na carteira e crédito de até 50% do cashback travado (`contract_credit`). As regras estão fixas no SQL.
- **Planos definidos em 5 lugares** (`mockData`, `CampaignForm`, `useSubscriptionPlans`, `useClientCatalog` e outro bloco do `mockData`).

## Problemas a resolver

- O usuário consegue criar o próprio registro de indicação e a própria assinatura (ver `seguranca.md`).
- Uma compra de valor muito baixo já dispara a recompensa (ex.: R$ 5, 15 ou 25 fixos no código), o que permite abuso com contas descartáveis.
- A regra de importação (`source = 'import'`) só é respeitada em uma das duas funções de liberação.
- Há duas implementações da liberação de indicação, mais uma legada ainda ativa.

## Plano

1. **Definir o cashback** (A03) e a receita da v1 (A04); só depois ajustar os números.
2. **Indicação simples na v1:** link ou código por usuário; a recompensa só é liberada após compra real acima de um mínimo; um único fluxo de liberação; valores vindos de `referral_campaigns` em vez de fixos no SQL.
3. **Assinaturas:**
   - uma única fonte de planos (`site_settings.subscription_plans`, via `useSubscriptionPlans`);
   - a ativação só ocorre depois do pagamento confirmado pelo gateway (webhook), nunca pelo navegador;
   - decidir quais planos existem na v1 (produtor, consumidor ou ambos).
4. **Cashback:** regras (travado, fracionado, limite de crédito) em configuração, não em constantes; extrato que fecha com o saldo.
5. **Representantes e rede de afiliados:** fora da v1; só após parecer jurídico e tributário, com regra de remuneração baseada em vendas reais e não em recrutamento (diretriz do requisito §14).
6. **Anti-abuso:** mínimo de compra, bloqueio de auto-indicação e de compra do comprador igual ao vendedor, limite por período.

## Perguntas em aberto
- Como o cashback funciona na v1 e para que serve (desconto na próxima compra, recompensa de indicação ou ambos)?
- Quais assinaturas entram e com que benefícios, e como isso fecha com a taxa por transação?
- Quem valida a regra de comissão do ponto de vista jurídico e tributário?

## Verificação (em staging)
- Indicação só gera recompensa após compra real acima do mínimo.
- Assinatura só fica ativa com pagamento confirmado.
- Alterar os valores do plano em `site_settings` muda tela, cobrança e benefício sem mexer em código.
- O extrato da carteira bate com o saldo e com as recompensas liberadas.

## Depende de
`seguranca.md`; `planos/comercial-pedidos-pagamento-entrega.md` (gateway e webhook); A03, A04 e A09.
