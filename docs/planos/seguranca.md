# Plano: segurança

São ajustes esperados em um protótipo gerado por ferramenta, e esta lista serve para priorizá-los. Base: análise estática do código e das migrations, ou seja, **pelo que a leitura mostra; nada foi confirmado no banco real nem em staging**. Se já houver pessoas reais cadastradas, avaliar com o jurídico se algo precisa ser comunicado (decisão A12). Este documento descreve classes de problema, não passo a passo de exploração. Nenhum teste de segurança deve ser feito contra produção.

## Riscos críticos

| # | Risco | Onde |
|---|---|---|
| 1 | Funções financeiras confiam no ID de usuário enviado por quem chama, não validam o usuário logado e não têm o acesso restrito | RPCs `process_sale_split`, `process_checkout_acid`, `contract_credit`, `sell_kit_acid`, `release_*` (migrations de 2026-04) |
| 2 | Dados pessoais e bancários legíveis sem login (CPF, Pix, telefone, senha temporária em texto) | policies abertas em `profiles` e `referrals` (migration `20260512032949`) |
| 3 | Fluxo de ativação aceita papel e código controlados pelo cliente, sem expiração efetiva | edge function `self-activate`; `user_activations` aberta |
| 4 | O usuário pode alterar campos sensíveis do próprio perfil e assinatura | policies de UPDATE sem restrição de colunas em `profiles` e `subscriptions` |
| 5 | Funções de IA e imagem públicas e sem limite de uso | `ai-router`, `vini-chat`, `suggest-*`, `sanitize-images` e outras 10 |
| 6 | Contabilidade feita no navegador, em várias etapas soltas | `WalletPage`, `AuthPage` |

## Riscos médios

- Views com possível perda de `security_invoker` (`registration_check_view`, `v_lead_funnel`, `admin_financial_health`): confirmar no banco.
- Policies `anon` com `WITH CHECK (true)` em `system_logs`, `stock_movements`, `kit_transactions`, `ai_savings_*`, `support_requests`.
- Funções auxiliares sem checagem de dono (`apply_stock_entry`, `generate_referral_link_24h`, ranking).
- Bugs de ledger: taxas lançadas em duplicidade, baixa parcial de estoque em erro, validação de parcelamento 5x que nunca roda.
- Ratings sem unicidade nem verificação de compra.
- Migrations com UUIDs reais de usuários Master (não replicáveis em ambiente novo).

## Plano de correção (ordem)

1. **Acesso e ambiente:** obter o repositório e o projeto Supabase; criar staging separado; **antes de mudar produção**, o Daniel autoriza a janela.
2. **Migration de hardening** (nova; não editar migrations antigas):
   - tirar o acesso público (`anon`/`public`) das RPCs financeiras e administrativas;
   - dentro delas, exigir que o chamador seja o próprio comprador (ou Master) e validar valores positivos;
   - trocar retornos de erro por exceção (rollback completo).
   Modelos já existentes no projeto: `vini_brain_register_hit` (acesso restrito a `service_role`) e as views com `security_invoker`.
3. **Leitura pública:** remover as policies abertas de `profiles` e `referrals`; expor só campos públicos por view ou RPC específica (`get_referrer_info_by_code` já existe).
4. **Perfil e assinatura:** bloquear por trigger a alteração de colunas sensíveis pelo próprio usuário.
5. **`self-activate` e `user_activations`:** exigir usuário autenticado, comparar o código por igualdade, respeitar a expiração, aceitar só papéis permitidos, gerar o código no servidor com aleatoriedade criptográfica e limitar tentativas.
6. **Edge functions:** `_shared/auth.ts` (exigir usuário e papel) e `_shared/rateLimit.ts`; aplicar nas funções de IA e imagem.
7. **Dados já expostos:** rotacionar senhas temporárias e revisar o que ficou legível (depende de A12).
8. **Views e policies restantes:** recriar com `security_invoker`, trocar `anon true` por `service_role` ou restrição por dono.

## Verificação (em staging)

Cada correção vira teste automatizado que deve **falhar antes e passar depois**:
- usuário não logado não executa as funções financeiras nem lê `profiles`/`referrals`;
- usuário comum não executa uma função de dinheiro em nome de outro;
- usuário comum não altera os campos sensíveis do próprio perfil;
- o fluxo de ativação recusa código expirado, código com curinga e papel fora da lista;
- funções de IA recusam chamada sem login e respondem a limite de uso.

## Depende de
Decisões A11 e A12; `roadmap.md` (Fase 0).
