## Fase 1 — Correções Críticas (Estabilidade)

1. **Correção da tela em branco no CRUD de usuários**
   - Adicionar validação com Zod nos formulários do AdminPanel
   - Garantir tratamento de erros com try/catch e feedback via Toast
   - Corrigir layout com `flex-1` e `overflow-y-auto`

2. **Proteção de rotas administrativas**
   - Bloquear acesso direto via URL às abas admin para não-MESTRE
   - Redirecionar usuários sem permissão

3. **Correção do fluxo de e-mail de ativação**
   - Verificar configuração de confirmação de e-mail (auto_confirm desabilitado)
   - Garantir que o perfil só seja liberado após confirmação do e-mail

## Fase 2 — RBAC e Gestão de Perfis

4. **Obrigatoriedade de perfil no cadastro**
   - Adicionar seleção de perfil (Comprador/Prestador/Misto) na tela de Signup
   - Inserir role automaticamente na tabela `user_roles` após cadastro

5. **Proteção do último MESTRE**
   - Criar função PostgreSQL que impede remoção do último master

6. **Cadastro manual de usuários pelo MESTRE**
   - Criar Edge Function para criação de usuários via admin
   - Adicionar formulário "Novo Usuário" na aba Usuários

## Fase 3 — Motor Financeiro

7. **Seleção obrigatória de plano no Signup**
   - Integrar seleção de plano (Bronze/Prata/Ouro) ao fluxo de cadastro

8. **Débito inicial na carteira**
   - Ao finalizar cadastro, gerar lançamento de débito negativo

9. **Contador regressivo de 24h**
   - Exibir timer na carteira baseado em `created_at + 24h`
   - Bloquear ativação se expirado, permitir reenvio

10. **Botão "Pagar Assinatura" + Cashback**
    - Zerar débito e gerar cashback automático como saldo positivo

11. **Extrato transacional**
    - Tela de extrato detalhado para usuário e MESTRE
