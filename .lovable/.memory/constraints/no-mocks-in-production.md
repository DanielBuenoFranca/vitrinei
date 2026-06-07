---
name: No mock data in production pages
description: Páginas de produção (/client, /mei) usam dados reais via hooks; demos mantêm mocks
type: constraint
---
Sistema está em produção. **Nunca** importar de `@/data/mockData` em páginas de produção (`ClientApp.tsx`, `MeiPanel.tsx`, `Landing.tsx`, fluxos reais).

- `/client` → `useClientCatalog()` (services/products/plans/user/meiProfessionals reais)
- `/mei` → `useMeiDashboard()` (stock/financials/services reais filtrados pelo provider do usuário)
- Quando DB vazio → renderizar `<EmptyStateVini>` com CTA para `/admin` e `viniPrompt` para abrir o chat com pergunta pré-preenchida
- `EmptyStateVini` dispara `window.dispatchEvent(new CustomEvent('vini:open', { detail: { prompt } }))` — `FloatingAiAvatar` escuta esse evento

Páginas que são explicitamente demos (`ServiceManagementDemo`, `ClientJourneyDemo`, `MeiManagerDemo`, `DropshippingDemo`, `SupportCenterDemo`) podem manter mocks, mas devem ter badge "Demo" visível.
