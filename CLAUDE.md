# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

Vitrinei: plataforma que conecta consumidores a produtores/MEIs/comerciantes locais, com painel de gestão (MEI), app do cliente, painel admin e o assistente "Vini" (IA). Projeto gerado e sincronizado com o Lovable (Vite + React + TS + Tailwind + shadcn/ui, backend Supabase). O arquivo `requisito` (sem extensão, PT-BR) é o documento de alinhamento do produto: módulos, perfis, MVP, regras de indicações/comissões.

## Comandos

- `npm run dev` — Vite na porta 8080
- `npm run build` / `npm run build:dev` / `npm run preview`
- `npm run lint` — ESLint
- `npm test` — `vitest run` (jsdom, `src/**/*.{test,spec}.{ts,tsx}`, setup em `src/test/setup.ts`); `npm run test:watch` para modo watch
- Um teste só: `npx vitest run src/test/example.test.ts` ou `npx vitest run -t "nome do teste"`
- Playwright usa `lovable-agent-playwright-config` (`playwright.config.ts`)
- Há `package-lock.json`, `bun.lock` e `bun.lockb`; o README manda usar npm
- Alias `@` → `src/`. TS com `strict: true`, mas `noImplicitAny: false`

## Arquitetura

### Frontend (`src/`)

- `App.tsx` concentra os providers (Theme → Auth → Cart → Favorites → QueryClient → Router → Conversion → AiSession → BackgroundJobs) e todas as rotas. Só `ViniHome`, `AuthPage` e `NotFound` são eager; o resto é `lazy` via `LazyRoute` (ErrorBoundary + Suspense + skeleton). Rotas passam por `ForceResetGuard` (redireciona para `/reset-password` se `must_reset_password`); `/admin` passa por `AdminRoute` (role admin/master).
- **Auth** (`contexts/AuthContext.tsx`): hidrata `profiles` + `user_roles` fora do callback de `onAuthStateChange` (via `setTimeout`) para evitar deadlock do lock do Supabase. Nunca chame o supabase dentro desse callback. Contas `inactive`/`banned` são deslogadas.
- **Permissões**: `lib/permissions.ts` é a única fonte da matriz `PERMISSIONS` (chaves `area.feature`) e de `WRITE_PERMISSIONS` (bloqueadas em estado lead/paywall). Não duplique checagens em componentes; use `hooks/usePermissions.ts`, `PermissionGate` e `AccessGate`. Papéis: master, admin, moderator, user, client, provider, mixed.
- **Dados reais vs. mock** (regra em `.lovable/.memory/constraints/no-mocks-in-production.md`): páginas de produção (`/client`, `/mei`, `Landing`) nunca importam `@/data/mockData`; usam `useClientCatalog()` e `useMeiDashboard()`. Com o DB vazio, renderizam `<EmptyStateVini>` (dispara o `CustomEvent` `vini:open` no `window`). Só as páginas de demo (`ServiceManagementDemo`, `ClientJourneyDemo`, `MeiManagerDemo`, `DropshippingDemo`, `SupportCenterDemo`) podem usar mocks, e devem exibir o badge "Demo". Elas ficam em `src/demo/` (junto de `Demos` e `ProcessFlows`), não em `src/pages/`. Pendência: `ClientApp.tsx` e `hooks/useClientCatalog.ts` ainda importam `@/data/mockData`.
- `components/` é agrupado por domínio (`access`, `cart`, `favorites`, `referral`, `layout`, `vini`, `landing`, `admin`, `radar`, `storefront`, `flows`); `ui/` é só shadcn. Não deixe componentes soltos na raiz de `components/`.
- **Vini** (assistente de IA): UI em `components/vini/` (`ViniScene` usa imagens de fundo; three/react-three-fiber só entra na rota lazy `/radar-urgencia`), saudações e sugestões em `lib/viniBrain.ts` (o Vini nunca diz que é uma IA), estado em `contexts/AiSessionContext`. Backend nas edge functions `ai-router`, `vini-chat` e `vini-brain-learn`.
- `components/ui/` é shadcn/ui (`components.json`); telas admin ficam em `components/admin/`. Textos da UI são em português.

### Backend (`supabase/`)

- `src/integrations/supabase/client.ts` e `types.ts` são gerados; não edite à mão.
- `supabase/migrations/` (~100 SQLs com nomes gerados pelo Lovable) é a fonte do schema.
- `supabase/functions/*` são Edge Functions Deno (create/delete/activate-user, process-sale, ai-router, vini-chat, import/enrich, imagens etc.); código compartilhado em `_shared/` (`aiCredits`, `intentEngine`, `viniBrain`, `imageUnderstanding`).
- **Fluxo de IA**: `ai-router` roda primeiro o motor determinístico (`_shared/intentEngine`, que cruza a mensagem com o estoque real; confiança ≥ 0.6 responde sem gastar crédito) e só depois chama o LLM (`LOVABLE_API_KEY`), respeitando o toggle global de economia de créditos (`getAiMode`, modo `off`).
- `.env` guarda apenas URL e chaves públicas do Supabase (`VITE_SUPABASE_*`).
