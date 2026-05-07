Plano de execução em 3 entregas sequenciais para cobrir as 5 frentes solicitadas, priorizando estabilidade do banco (CARDEX) e governança de créditos antes da UX de importação e indicações.

## Entrega 1 — Estabilidade backend (CARDEX + Gating IA + Imagens estoque)

**2. CARDEX**
- Migração: `ALTER TABLE stock_movements DROP CONSTRAINT stock_movements_movement_type_check` e recriar aceitando os valores hoje em uso (`sale`, `entry_in`, `kit_consumption`, `kit_supplier_debit`, `adjust_in`, `adjust_out`, `service_execution`) — mantendo lower_case que já é padrão das RPCs `sell_kit_acid`/`apply_stock_entry`. Decisão: padronizar lowercase (não maiúsculas) para não quebrar funções já em produção; documentar enum.
- Adicionar `item_kind = 'service'` no fluxo: novo tipo de movimento `service_execution` sem decremento de estoque. Permitir `quantity_delta = 0` e `balance_after = NULL` para serviços.
- `CardexPanel.tsx`: ao escolher tipo "Serviço", esconder campos de quantidade/estoque, exibir apenas preço, M.O. e histórico.

**3. Gating IA + Imagens**
- `useAiMode.ts` / wrappers de chamada IA: capturar 402/429 silenciosamente (try/catch + `logAiSavings`), nunca mostrar toast ao usuário final, ativar fallback `[AI off]`.
- `ImageSanitizationPanel`: novo botão "Buscar imagens estoque (web)" que dispara edge function `search-product-image` (já existe) em lote para `dynamic_products` sem `image_url`. Estilo e-commerce.

## Entrega 2 — Importação inteligente

**1. Frente importação `/importar`**
- `ImportPage.tsx`:
  - Highlight de erro por campo (não por linha): aplicar classe `border-red-500` apenas no `<input>` do email/telefone em conflito.
  - Agrupamento por chave (email OU CPF normalizado): mesclar linhas, e quando houver divergência exibir checklist por campo (planilha vs base) com radio "manter base / usar planilha".
  - Validação produtos↔serviços: ao processar serviços com `linked_products`, procurar produto por nome normalizado em (a) base atual e (b) outras linhas da mesma planilha; só falhar se nenhum dos dois resolver.
  - Duplicidade de serviços: substituir registro existente preservando `labor_cost` da planilha e re-vinculando `linked_product_ids`.
- UI: forçar `overflow: scroll` (não `auto`) no container do preview para barras sempre visíveis.

## Entrega 3 — Indicações 24h + Gestão usuários/assinatura

**4. Links 24h**
- Migração: adicionar `expires_at timestamptz`, `link_token text unique`, `max_uses int default 1` em `referrals`. Índice em `expires_at`.
- RPC `generate_referral_link(_referrer uuid)`: valida ≤3 links ativos, gera token aleatório, expira em 24h.
- `WalletPage.tsx`: botão "Gerar link 24h" + lista discreta dos últimos 10 (timestamp + status calculado).
- `ReferralLanding.tsx`: validar `expires_at` e marcar como consumido após cadastro.
- `CampaignForm.tsx` (admin): tabela ordenada por `expires_at ASC`, edição inline da data, novos cards totalizadores: Total / Pendentes / Ativados / Total Pago / Bonificação gerada (lida de `wallet_transactions` tipo `referral_cashback`+`referral_bonus`).

**5. Usuários + Assinatura**
- `AdminPanel` Usuários: coluna "Papéis" mostra apenas labels: Master, Administrador, Comprador, Prestador (mapping em `usePermissions`).
- `UserForm.tsx`: dois selects — "Perfil" (Comprador/Prestador/Misto) + "Acesso" (Padrão/Admin/Master). Default: Comprador + Padrão.
- Status de assinatura visível; ao trocar plano, calcular diff via `useSubscriptionPlans` e lançar débito/crédito em `wallet_transactions` tipo `subscription_adjustment`.
- CEP obrigatório no cadastro (já implementado parcialmente em entrega anterior — reforçar `required` + bloqueio de submit até `latitude/longitude` resolvidos). ISENTO já implementado, manter.

## Riscos / decisões técnicas

- **Padrão de `movement_type`**: manter lowercase (oposto ao texto do usuário que pediu maiúsculas). Motivo: 4 RPCs em produção já gravam lowercase; mudar para uppercase exigiria reescrever `sell_kit_acid` + `apply_stock_entry` + dados históricos. Vou comunicar essa decisão.
- **Sem novas tabelas**: aproveitar `referrals` existente (extensão de colunas).
- **AI silent fail**: já existe `[AI off]` no padrão de resiliência — apenas garantir que NÃO toast o erro 402.

Posso começar pela Entrega 1 (CARDEX + gating)?
