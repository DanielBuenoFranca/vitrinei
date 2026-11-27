# Plano: organização do código e design system (Vitrinei)

Complementa `docs/diagnostico-v1.md` e `docs/resumo-para-daniel.md`. Nada aqui foi executado.

> **Status:** a **Parte B (design system com Impeccable) está adiada** (decisão D09 em `decisoes.md`). A Parte A só avança nas frentes que não tocam em dinheiro.

> **Executado em 26/11/2026 (só organização, sem mudar comportamento):** git inicializado; `.env` ignorado e `.env.example` criado; `bun.lock`/`bun.lockb` removidos e `package-lock.json` sincronizado; script `typecheck`; código morto removido (9 arquivos, 4 PNGs, 28 `ui/*`, 25 pacotes); 7 páginas de demo movidas para `src/demo/`; 18 componentes soltos agrupados por domínio; `console.log` sem guarda de DEV removidos. **Continua pendente:** `mockData` em `ClientApp`/`useClientCatalog` (A5), `searchData`, `xlsx`, Playwright, `supabase/config.toml` vazio, tipagem (A2), camada de dados (A3), quebra de páginas (A4) e o resto de A6/A7. Lint: 501 problemas (469 erros), eram 506 antes.

## Decisões de trabalho

- **Design system (quando começar):** usar o Impeccable para **documentar e consolidar** o sistema atual, preservando a identidade e o escritório 3D do Vini (requisito §18). Sem redesign.
- **Ordem:** segurança e checkout primeiro; a organização corre em paralelo, só nas frentes que não mexem em dinheiro.

## Estado atual (evidência)

- **Tokens bons:** `src/index.css` tem tokens semânticos em HSL para 2 temas (`espacial` escuro com neon, `comercial` claro), mais tokens do Vini (glass, glow, nebula). `tailwind.config.ts` os mapeia e o shadcn usa `cssVariables`. Só 59 usos de hex/rgb em 13 arquivos (maiores: `ProviderStorefront` 16, `Radar3DScene` 10, `Search3DHero` 8).
- **Sem escala tipográfica:** 830 usos de `text-[8..11px]` em 48 arquivos (`AiAvatarGlobal` 31, `CartBar` 22, `CampaignForm` 17). Tamanhos abaixo do recomendado para leitura no celular.
- **Fontes com definições diferentes:** 3 famílias (Inter, Plus Jakarta Sans, Space Grotesk) carregadas por `@import` do Google. O `tailwind.config` define `display` como Plus Jakarta, mas o CSS põe `h1`–`h3` em Space Grotesk.
- **Sem `PRODUCT.md`, `DESIGN.md` nem `.impeccable/`.**
- Pontos de melhoria estruturais: 5 páginas muito grandes, 274 `supabase.from` na UI, 0 `useQuery`, 214 `: any` + 145 `as any`, mocks em produção, código morto.

## Parte A: organização do código

Regras gerais:
- Repositório git primeiro (a pasta não é repo; pedir o GitHub ao Daniel).
- Uma branch e um PR pequeno por frente.
- Cada PR com `lint`, `tsc --noEmit`, `test` e `build` verdes.
- **Nenhuma refatoração toca em carteira, checkout ou RLS enquanto a Fase 1 de segurança não fechar.**

### A1. Higiene e tooling (sem risco)
- `.gitignore` com `.env`; criar `.env.example`; apagar `bun.lock` e `bun.lockb` (manter `package-lock.json`).
- Script `typecheck` (`tsc --noEmit -p tsconfig.app.json`). Mover `@types/three` para devDependencies.
- ESLint: `no-unused-vars` de `off` para `warn`; `no-explicit-any` como `warn`.
- CI (GitHub Actions): `npm ci`, `lint`, `typecheck`, `test`, `build`.
- Código morto (confirmar com o build):
  - `pages/Index.tsx`;
  - 7 componentes sem referência: `flows/ClientFlowDiagram`, `landing/CoverageFlowDiagram`, `landing/DemoPortfolio`, `landing/EcosystemMindmap`, `landing/TransactionSequenceDiagram`, `vini/ViniAvatar`, `NavLink`;
  - 28 `ui/*` não importados (accordion, calendar, carousel, chart, drawer, form, sidebar etc.);
  - pacotes sem uso: `@react-three/postprocessing`, `embla-carousel-react`, `vaul`, `input-otp`, `cmdk`, `react-resizable-panels`, `react-day-picker`;
  - 4 PNGs não referenciados em `src/assets` (~4,7 MB).
- `xlsx@0.18.5` é vulnerável: trocar pelo build do CDN do SheetJS ou por `exceljs` (uso só em `pages/ImportPage.tsx`).
- Playwright: declarar a dependência ou usar `defineConfig` próprio (hoje importa `lovable-agent-playwright-config` sem declarar).

### A2. Tipagem (incremental, por pasta)
- Usar `Tables<>`, `TablesInsert<>` e `Enums<>` de `src/integrations/supabase/types.ts` em hooks e serviços novos.
- Remover os `(supabase as any).rpc(...)` desnecessários: `ProductForm:225`, `ServiceForm:175`, `KitBuilder:116`, `useAiMode:89/105`.
- Ligar `noImplicitAny` por pasta, começando em `src/lib`, `src/hooks` e `src/features/*`. Meta: zero `any` em código novo.

### A3. Camada de dados e estrutura por feature
Estrutura alvo, migrada aos poucos:

```
src/
  features/
    catalog/  {api.ts, hooks.ts, components/}
    orders/   {api.ts, hooks.ts, components/}   # novo (checkout v1)
    wallet/
    vini/     {components/, useViniChat.ts, routeIntent.ts}
    admin/    {tabs/}
    import/   {parser.ts, matching.ts, steps/}
  demo/       # páginas *Demo, flows, landing diagrams, mockData
  components/ui/   # só o shadcn que é usado
  lib/ contexts/ integrations/
```

- `api.ts` é a única camada que chama `supabase.from`, `rpc` e `functions.invoke`. `hooks.ts` usa `useQuery` e `useMutation` (o `QueryClient` já está configurado em `App.tsx` e nunca é usado).
- Modelos a copiar: `hooks/useClientCatalog.ts` e `hooks/useMeiDashboard.ts`; converter ambos para `useQuery` primeiro. `MeiPanel` já é o exemplo de página fina.
- Ordem dos domínios: `catalog` → `orders` (junto do checkout) → `wallet` (só depois da Fase 1, via RPC) → `admin`.

### A4. Quebra das páginas muito grandes
Extrair primeiro a lógica pura, com teste; depois a UI. Meta de ~300 linhas por arquivo.
- `ViniHome` (1730): `routeIntent.ts` (regex de `analyzeAndRoute`), `useViniProfile` (hidratação de `profiles`, `subscriptions`, `providers`), `useViniChat`.
- `AdminPanel` (1989, 49 `useState`): uma aba por arquivo em `features/admin/tabs/`, com `PermissionGate` em todas.
- `ImportPage` (2235): `parser.ts`, `matching.ts`, passos como componentes; proteger a rota com guard (hoje sem `AdminRoute`).
- `ProviderStorefront` (1446), `Landing` (1809); `WalletPage` (967) só depois da Fase 1.
- Quando: junto da feature que toca a tela.

### A5. Isolar mocks e demos
- Mover `*Demo`, `ProcessFlows`, `Demos`, `components/flows`, `components/landing` e `data/mockData.ts` para `src/demo/`, atrás de `/demos` (lazy), com **badge "Demo" visível** em todas (hoje só `ServiceManagementDemo` tem).
- Remover `mockData` de `ClientApp` (importa `checkEligibility` e `getContextualProducts` em runtime): mover a regra de crédito e elegibilidade para servidor ou hook.
- Separar `data/searchData.ts`: motor de busca (código) × inventário fictício (`mockResults`, `productInventory`). Produção usa só o catálogo real.
- Tirar o carrinho do funil Demo (`CartBar`, `ClientApp`, `Landing`, `AiAvatarGlobal` navegam para `/jornada-cliente`, `/dropshipping` etc.). Isso se resolve com o checkout real.

### A6. Fontes únicas de verdade
- Planos Bronze/Prata/Ouro (hoje em 5 lugares): só `site_settings.subscription_plans`, via `useSubscriptionPlans`.
- Permissões: usar `lib/permissions.ts`, `usePermissions` e `PermissionGate` também em `/mei`, `/carteira` e `/importar`; remover o `roles.some(...)` duplicado em `ViniHome`.
- Intenção: uma só implementação (servidor, `_shared/intentEngine`), com o cliente como fallback fino. Decidir o destino de `semanticSearch` em `searchData.ts`.
- ErrorBoundary global acima de `<Routes>` (hoje `/`, `/auth` e `*` ficam de fora).
- Trocar os 26 `catch {}` silenciosos por log ou toast (10 estão em `ViniHome`); remover os 47 `console.log`.

### A7. Testes (começando pelo que é puro)
- Vitest: `lib/permissions.ts` (`canDo`, `resolveProfileType`), `routeIntent`, parser do import, regras de elegibilidade e taxas que sobrarem no cliente.
- RPCs, RLS e checkout: testes em staging.
- Playwright: um fluxo ponta a ponta (cadastro → vitrine → carrinho) quando o checkout existir.

## Parte B: design system com Impeccable (documentar e consolidar)

O Impeccable trata telas de app como modo Operate e a landing como Persuade. Fluxo, em ordem:

1. **`/impeccable init` → `PRODUCT.md`.** Entrevista de produto, não de estética. Já sabemos: usuários (consumidor, produtor e representante no celular; gestor e admin no desktop), propósito, e a restrição de preservar a identidade e o escritório 3D do Vini. Falta o posicionamento do produto (resposta do dev ou do Daniel).
2. **`/impeccable document` (scan) → `DESIGN.md` e `.impeccable/design.json`**, a partir de `src/index.css`, `tailwind.config.ts`, `components.json` e dos componentes. Documenta os **dois temas**, os tokens do Vini, o raio `1rem` e o glassmorphism. Aqui se decide o **tema padrão no celular** (hoje `:root` é o Espacial).
3. **`/impeccable extract` → tokens e componentes** (só o que se repete 3+ vezes):
   - **escala tipográfica** de 5 a 6 degraus no lugar dos 830 `text-[8..11px]`, com corpo mínimo legível no celular; começar por `ClientApp`, `CartBar`, `AiAvatarGlobal` e `WalletPage`;
   - uma só definição de fontes, carregada por `<link>` com `font-display: swap` em vez de `@import`;
   - `.glass` e similares como tokens ou componentes; os hex residuais viram tokens;
   - componentes compartilhados: `PageHeader`, `StatTile`, `EmptyState` (já existe `EmptyStateVini`), `PriceTag`, `SectionCard`, campos de formulário com `Label htmlFor`;
   - migrar tela a tela, das que o usuário final vê para as de admin: `ClientApp` → `MeiPanel` → `CartBar` → `ViniHome` → `ProviderStorefront` → `WalletPage`.
4. **`/impeccable audit` e `critique`** nas telas de produção:
   - acessibilidade: 12 `htmlFor` em 111 `Label`, 8 `focus-visible`, `Card` clicável sem teclado em `ClientApp:856-868`;
   - responsividade: `ClientApp` é uma coluna estreita sem breakpoints; `ViniHome` usa px absolutos;
   - performance: avatares PNG de ~1,5 MB para WebP; fontes.
5. **Telas novas da v1** (checkout, pedidos, modalidade de entrega, onboarding do produtor): `/impeccable shape`, `onboard`, `harden`, `adapt` (mobile-first) e `polish` no final, sempre sobre o `DESIGN.md`.
6. **Opcional:** `/impeccable hooks on`, para o detector rodar após cada edição de UI.

## Sequência e dependências

| Ordem | Frente | Depende de | Toca em dinheiro? |
|---|---|---|---|
| 0 | Git e acesso ao repositório (Daniel) | acesso | não |
| 1 | A1: higiene, tooling, CI e código morto | git | não |
| 1 | Segurança (Fase 1) | acesso ao Supabase | sim; não espera a organização |
| 2 | Parte B passos 1–2 (`PRODUCT.md`, `DESIGN.md`) | git e resposta do dev ou do Daniel | não |
| 2 | A2 tipagem, A7 testes puros, A5 isolar demos | A1 | não |
| 3 | A3 camada de dados (`catalog`) e Parte B passo 3 | A1 e `DESIGN.md` | não |
| 3 | Checkout e pedidos (Fase 2) e Parte B passo 5 | Fase 1 de segurança | sim |
| 4 | A4 quebra de páginas, A6, `wallet` e `admin` em `features/` | Fase 1 fechada | parcialmente |
| 5 | Parte B passo 4 (audit, critique, polish) e A7 e2e | telas novas prontas | não |

## Decisões em aberto

- Tema padrão no celular (Espacial escuro ou Comercial claro) e se os dois permanecem.
- Manter as 3 famílias de fonte ou reduzir para 2.
- Posicionamento do produto, para o `PRODUCT.md`.
- Migrar tudo para `features/` já ou só nas features novas e nas tocadas (recomendado: só nas novas e nas tocadas).

## Verificação

- Cada PR: `npm run lint`, `typecheck`, `npm test` e `npm run build` verdes, sem crescer o bundle inicial.
- Código morto: o build e o `tsc` seguem passando após a remoção; nenhum import órfão.
- Design: `DESIGN.md` e `.impeccable/design.json` descrevem os dois temas. Abrir o app (`npm run dev`, porta 8080) nos dois temas, em 390 px e no desktop, nas telas migradas, sem regressão visual e sem `text-[Npx]` abaixo do mínimo.
- Acessibilidade: `/impeccable audit` sem itens críticos nas telas de produção.
