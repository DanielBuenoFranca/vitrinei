# Comparativo de gateways Pix com split (Vitrinei)

Pesquisa feita em 26/11/2026 em páginas e documentação dos próprios provedores. **Preços e prazos precisam ser confirmados nas tabelas vigentes** antes de qualquer decisão: as fontes divergem entre si. Decisão final: Daniel.

## Comparação

| Critério | Asaas | Mercado Pago | Pagar.me |
|---|---|---|---|
| Split com Pix | Sim. Instantâneo após o pagamento, só via API. A soma dos percentuais não passa de 100%, e a taxa da cobrança é descontada antes da divisão. | Sim. `application_fee` (Checkout Transparente) ou `marketplace_fee` (Checkout Pro). A comissão do Mercado Pago sai primeiro; a do marketplace incide sobre o restante. | Sim, com 2 ou mais recebedores. Divisão por valor fixo ou percentual. Ao menos um recebedor assume chargeback e taxas. |
| Cadastro do produtor | Cada produtor precisa de uma **subconta** Asaas. Os termos exigem autorização do titular da subconta para cadastrar a chave Pix. | Cada produtor vincula a **própria conta Mercado Pago** (OAuth). | Cada produtor vira um **recebedor**, com cadastro e KYC. |
| Custo do Pix | Tarifa **fixa** por transação. As páginas divergem: R$ 1,59 (página de preços) ou R$ 1,99 (com R$ 0,99 promocional por 3 meses); outra página fala em promoção com as 100 primeiras transações Pix do mês sem tarifa. **Confirmar.** | Cerca de 0,99% para Pix em site ou loja online (aparece em FAQ de página de marketing; **confirmar**). Sem tarifa extra pelo split. | Não encontrei o preço do Pix. Custos de gateway e antifraude ficam com o marketplace e não entram no split. |
| Cartão | **Não pesquisado nesta rodada.** Taxas, parcelamento e prazo de repasse a levantar (cartão faz parte do escopo da v1) | idem | idem |
| Ressalvas | Conta Escrow tem taxa mensal. Tributação sobre o split deve ser validada com contador. | O prazo de repasse do Pix diverge entre fontes. | A documentação mistura versões v3 e v4. O split pode exigir afiliação ou ser PSP; confirmar com o suporte. |

## Leitura para o Vitrinei

Cenário: tickets pequenos (alimentos, congelados, itens simples).

- **Tarifa fixa pesa mais em ticket baixo.** R$ 1,59 a R$ 1,99 num pedido de R$ 40 equivale a cerca de 4% a 5%. Uma tarifa percentual de ~1% custa R$ 0,40.
- **A receita atual não cobre uma tarifa fixa.** `process_sale_split` cobra 1% do comprador e 1% do vendedor, 2% no total. Em R$ 40 são R$ 0,80. Antes de fixar preços, é preciso decidir quem paga a tarifa do gateway: comprador, produtor ou Vitrinei.
- **O cadastro do produtor é o gargalo.** Todos exigem cadastro individual do produtor (subconta, conta própria ou recebedor). Produtores informais com CPF podem desistir nessa etapa. Vale testar o onboarding no sandbox de cada um.
- **Alternativa mais rápida, com risco:** a Vitrinei receber o Pix e repassar pela carteira interna. Isso significa custodiar dinheiro de terceiros. **Validar com contador e jurídico antes.**

## Hipótese inicial

Asaas (foco em pequenos negócios) ou Mercado Pago (tarifa percentual; alguns produtores já podem ter conta). Nada está decidido.

Próximos passos sugeridos:
1. Conferir as tabelas vigentes de cada um.
2. Fazer uma prova de conceito no sandbox (cobrança Pix com split e webhook).
3. Isolar a integração num módulo próprio (por exemplo `_shared/payments`) para poder trocar de provedor.

## Fontes

- Asaas: [Checkout com Split de Pagamento](https://docs.asaas.com/docs/checkout-com-split-de-pagamento), [Split com Conta Escrow](https://docs.asaas.com/docs/split-para-contas-com-conta-escrow), [Preços e taxas](https://www.asaas.com/precos-e-taxas), [Split de pagamentos (blog)](https://blog.asaas.com/split-de-pagamento/), [Termos e Condições de Uso](https://central.ajuda.asaas.com/hc/pt-br/articles/32096847160859-Termos-e-Condi%C3%A7%C3%B5es-de-Uso)
- Mercado Pago: [Integrar o checkout em Split de Pagamentos](https://www.mercadopago.com.br/developers/pt/docs/split-payments/split-1-1/integration-configuration/integrate-marketplace), [Checkout Transparente em marketplace](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/how-tos/integrate-marketplace), [Aceitar Pix](https://www.mercadopago.com.br/ferramentas-para-vender/aceitar-pix)
- Pagar.me: [Split](https://docs.pagar.me/docs/pedidos-com-split), [Dividindo uma transação](https://docs.pagar.me/v3/docs/split-rules), [Recebedores](https://docs.pagar.me/docs/recebedores-2), [Pix](https://docs.pagar.me/docs/pix-1)
