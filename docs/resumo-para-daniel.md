# Resumo para o Daniel: onde estamos e o que precisamos para a v1

Fizemos uma leitura completa do projeto para planejar o lançamento da v1. Este resumo diz o que já funciona, o que falta, o que precisamos corrigir antes de lançar e o que precisamos de você. Os detalhes técnicos estão em `diagnostico-v1.md`, `planos/` e `comparativo-gateways.md`.

## 1. O que já funciona

O protótipo já tem muita coisa boa: o assistente Vini conversando em texto, o catálogo, a vitrine de cada produtor, a carteira com cashback, as assinaturas, as indicações e um painel administrativo. A base serve para continuar, sem recomeçar do zero.

## 2. O que falta para a v1

- **Pedidos:** hoje não existe o registro de um pedido, com seus status (recebido, em preparo, entregue).
- **Pagamento de verdade:** o carrinho ainda é uma simulação. Não há cobrança por Pix nem por cartão.
- **Entrega:** o fluxo do entregador hoje é uma demonstração com dados fictícios.
- **Aviso ao produtor:** não há notificação quando chega um pedido novo.

## 3. Pontos de segurança que precisamos corrigir antes de lançar

São ajustes comuns em protótipos criados com ferramentas de geração de código. Vimos isso **lendo o código**: ainda não conferimos no sistema real e não verificamos se houve algum uso indevido.

1. **Operações com dinheiro:** algumas funções que movimentam saldo não conferem quem está logado nem quem é o dono da conta.
2. **Dados pessoais:** uma configuração recente do banco permite ler, sem fazer login, dados de cadastro (como CPF, chave Pix e telefone).
3. **Tipo de conta no cadastro:** o cadastro aceita o tipo de conta escolhido pela própria pessoa, o que precisa ser limitado.
4. **Edição do próprio perfil:** a pessoa consegue alterar campos que deveriam ser só do sistema, como status e assinatura.
5. **Funções de IA:** estão abertas e sem limite de uso, o que pode gerar custo inesperado.
6. **Contas do saldo:** parte dos cálculos é feita no aparelho da pessoa, e deveria ser feita no servidor.

Se já houver pessoas reais cadastradas, queremos avaliar com o jurídico se algo precisa ser comunicado.

## 4. O que já definimos para a v1 (para você confirmar)

Definimos estes pontos em conversa com o dev responsável. Como o produto é seu, queremos a sua confirmação.

- **Onde:** piloto em Franca-SP.
- **O que se vende:** só produtos (alimentos, congelados, itens simples). Serviços ficam para depois.
- **Como se paga:** Pix, cartão, saldo da carteira e pagamento na entrega ou retirada.
- **Entrega:** retirada, entrega feita pelo próprio produtor, ou pedir um entregador por WhatsApp. O entregador como perfil dentro do app fica para a v2.
- **Vini:** só conversa por texto.
- **Indicação:** só a indicação simples (link ou código com cashback).
- **Operação:** você e a equipe pelo painel administrativo.

## 5. O que precisamos de você

### Acessos

- O repositório do **GitHub** que o Lovable sincroniza (a pasta que recebemos não é um repositório git).
- O projeto no **Supabase** (o banco e as funções de servidor): de quem é a conta e um acesso que nos deixe criar um ambiente de teste separado.
- O projeto no **Lovable**, para entender como o app é publicado.
- Quanto de crédito de IA o projeto consome hoje e quanto é pago.

### Decisões

| Decisão | Por que importa |
|---|---|
| Qual gateway de pagamento usar (Asaas, Mercado Pago ou Pagar.me) | Define a cobrança por Pix e cartão. Estamos comparando; falta conferir tarifas e testar o cadastro do produtor |
| Quem paga a tarifa do gateway | Hoje o Vitrinei cobra 2% (1% de cada lado). Em compras pequenas, a tarifa do gateway pode ser maior que isso |
| Como o cashback funciona | Ainda sem regra definida |
| Quais modelos de receita entram na v1 | Taxa por venda, assinatura do produtor, assinatura do consumidor |
| Como o Vitrinei ganha nos pedidos pagos na entrega | Esse pagamento acontece fora da plataforma |
| Quem são os primeiros produtores | Sem eles não há catálogo no lançamento |
| Orçamento mensal de IA | Sugerimos começar com um teto de mensagens por pessoa e medir por 2 a 4 semanas |
| Regras e impostos das comissões de indicação, e se o Vitrinei pode receber e repassar o dinheiro dos produtores | Precisam de contador e jurídico |
| Continuar no Lovable Cloud ou migrar o banco e a IA para contas próprias | Afeta custo e independência |

## 6. Como pensamos em fazer

1. **Base:** repositório, ambiente de teste e verificação de que o projeto compila.
2. **Segurança:** corrigir os pontos da seção 3 antes de vender qualquer coisa.
3. **Vender de verdade:** pedidos, pagamento, entrega e aviso ao produtor.
4. **Vini, indicação e assinaturas:** com limite de custo e cobrança real.
5. **Qualidade e celular:** testes, organização do código e melhorias de uso no celular.
6. **Independência do Lovable:** trazer para contas próprias o que for preciso.

A organização do código avança em paralelo, mas só nas partes que não mexem em dinheiro.
