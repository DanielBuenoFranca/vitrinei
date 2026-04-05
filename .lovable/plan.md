
# Plano de Execução – Correção e Implementação EcoMEI

## 🔴 FASE 1 (Esta mensagem) – Correções Críticas + Home UX
1. **Loja do Prestador** – Correções de persistência, logo, banner, upload
2. **Home UX** – Estado de busca (header + barra → expandir após pesquisa)

## 🟡 FASE 2 (Próxima mensagem) – Autenticação + Admin
3. **Login/Cadastro** – Google OAuth + Email/Senha via Lovable Cloud
4. **Controle de Acesso** – Gatilhos de login para compra/contratação
5. **Admin de Usuários** – CRUD de usuários no painel admin

## 🟢 FASE 3 (Mensagem seguinte) – Indicação + Carteira
6. **Módulo de Indicação** – Links/códigos únicos, comissionamento parametrizável
7. **Carteira do Usuário** – Saldo interno, cashback, uso na plataforma

## 🔵 FASE 4 (Última mensagem) – Importação de Planilha
8. **Importação Inteligente** – Parse de Excel, vinculação automática de prestadores/produtos/serviços

---

### Justificativa da divisão:
- Cada fase requer migrações de banco que precisam de aprovação
- Autenticação precisa estar pronta antes do módulo de indicação
- A importação depende do schema final estar estabilizado

### Notas técnicas:
- Migrações de banco para: profiles, user_roles, referrals, wallets
- Storage bucket para uploads de banner/logo
- Google OAuth via Lovable Cloud managed
- Edge functions para comissionamento
