┌────────────────────────────────┬───────────────┬───────────────────────────────────────────────────────────────────────────────────────────────┐
│              Área              │     Nota      │                                            Resumo                                             │
├────────────────────────────────┼───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Organização geral (pastas,     │ Boa           │ App.tsx claro; 15/18 páginas lazy; ErrorBoundary + skeletons por rota                         │
│ rotas lazy, providers)         │               │                                                                                               │
├────────────────────────────────┼───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Frontend: componentes          │ Fraca         │ 5 páginas-deus (ImportPage 2235, AdminPanel 1989, Landing 1809, ViniHome 1730,                │
│                                │               │ ProviderStorefront 1446 linhas), 175+ useState. Exceção boa: MeiPanel + useMeiDashboard       │
├────────────────────────────────┼───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Frontend: dados                │ Fraca         │ 274 supabase.from (≈85% em páginas/componentes); React Query instalado mas 0 useQuery; 214 :  │
│                                │               │ any + 145 as any apesar de types.ts pronto                                                    │
├────────────────────────────────┼───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Frontend: mock em produção     │ Atenção       │ ClientApp importa mockData em runtime (viola a regra do projeto); searchData.ts mistura       │
│                                │               │ serviços/produtos fictícios com o catálogo real; carrinho leva a páginas "Demo"               │
├────────────────────────────────┼───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Backend: modelo de dados       │ Média         │ Sem tabela orders; só 5 FKs; sobreposição profiles×providers por trigger bidirecional         │
├────────────────────────────────┼───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Backend: segurança             │ Crítica       │ ver abaixo                                                                                    │
├────────────────────────────────┼───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Testes / CI                    │ Inexistente   │ 1 teste expect(true); sem CI; Playwright depende de pacote Lovable não declarado              │
├────────────────────────────────┼───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Mobile-first / PWA             │ Parcial       │ MeiPanel responsivo; ClientApp coluna estreita; sem manifest/service worker; lang="en";       │
│                                │               │ og:image expirada                                                                             │
├────────────────────────────────┼───────────────┼───────────────────────────────────────────────────────────────────────────────────────────────┤
│ Independência (Lovable)        │ Alto          │ 12 edge functions usam gateway de IA Lovable; login Google via broker Lovable; projeto        │
│                                │ acoplamento   │ Supabase provisionado pelo Lovable                                                            │
└────────────────────────────────┴───────────────┴───────────────────────────────────────────────────────────────────────────────────────────────┘
