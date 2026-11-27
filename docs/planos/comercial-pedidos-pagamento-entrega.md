# Plano: comercial (pedidos, pagamento e entrega)

Objetivo: vender de verdade na v1 (Franca-SP, só produtos). **Só começa depois da Fase 1 de segurança** (`seguranca.md`), porque mexe em dinheiro.

## Estado atual

- Não existe tabela de pedidos. Uma compra vira linhas em `wallet_transactions`, baixa de estoque e registro em `system_logs` ou `kit_transactions`, sem ID de pedido, status ou itens.
- O carrinho (`CartBar`) leva a páginas de demonstração (`/jornada-cliente`, `/dropshipping`, `/central-atendimento`). Essas páginas usam dados fictícios e simulam o pagamento.
- A edge function `process-sale` e as RPCs `process_checkout_acid`/`process_sale_split` existem, mas nada no frontend as chama.
- Não há gateway de pagamento. O "QR Code Pix" do carrinho é só interface.
- A entrega (`RadarUrgencyFlow`, `DeliveryMap`) é um mock com entregador e PIN fictícios.

## Decisões já tomadas (`decisoes.md`)
Só produtos (D02); pagamento por Pix, cartão, saldo/cashback e na entrega/retirada (D03); entrega por retirada, entrega do produtor ou entregador via WhatsApp (D04).

## Entregas

### 1. Pedidos
- Tabelas novas: `orders` (comprador, produtor, status, modalidade de entrega, taxa de entrega, forma de pagamento, total), `order_items`, `order_events` (histórico de status).
- Status mínimos: criado → pago (ou "a pagar na entrega") → em preparo → pronto/saiu → entregue → cancelado.
- `wallet_transactions` ganha `order_id` para o extrato bater com o pedido.
- Restrições de integridade (valores e quantidades não negativos) e chaves estrangeiras.
- Regras de segurança (RLS): o comprador e o produtor veem só os próprios pedidos.

### 2. Checkout no servidor
- Uma função de servidor cria o pedido e valida preço e estoque no banco; o navegador não calcula valores.
- Evoluir `process-sale` para `create-order` e `confirm-payment`, usando operação atômica (tudo ou nada).
- Remover do carrinho o desvio para as páginas Demo.

### 3. Pagamento
- Módulo único `_shared/payments`, para poder trocar de gateway.
- **Pix e cartão:** gateway com webhook, que confirma o pagamento e atualiza o pedido. Escolha do gateway: decisão A01, ver `comparativo-gateways.md`.
- **Saldo/cashback:** só depois de definir o cashback (A03).
- **Pagamento na entrega/retirada:** pedido nasce "a pagar na entrega"; não passa pela plataforma (sem split). Como o Vitrinei ganha nesses casos é a decisão A05.
- **Quem paga a tarifa do gateway:** decisão A02. Hoje o SQL cobra 1% + 1% (2%); em pedidos de ticket baixo, uma tarifa fixa de gateway pode ser maior que isso.
- Parcelamento no cartão: a regra `auth_split_5x` hoje nunca é validada; definir antes de liberar.

### 4. Entrega
- Campo de modalidade no pedido: retirada, entrega do produtor ou pedir entregador.
- O produtor informa a taxa de entrega e o contato.
- "Pedir entregador" abre o WhatsApp (produtor ou entregador parceiro). Perfil de entregador fica para a v2.

### 5. Notificação ao produtor
- Aviso de novo pedido (começar simples: e-mail e/ou aviso no painel `/mei`). Chat cliente↔produtor fica fora da v1.

## Verificação (em staging)
- Compra ponta a ponta: carrinho → pagamento no sandbox → webhook → pedido pago → estoque baixado.
- O total do extrato bate com a variação do saldo e com o valor do pedido.
- Falha no meio do checkout não deixa estoque baixado nem saldo alterado.
- Pedido "na entrega" aparece para o produtor sem movimentar saldo.

## Depende de
`seguranca.md`; decisões A01, A02, A03, A05; acesso ao Supabase.
