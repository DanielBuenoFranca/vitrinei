# Registro de decisões

Neste documento, "usuário" é quem usa o app e "dev" é o dev responsável pela análise. Data: 26/11/2026.

## Definidas na conversa (confirmar com o Daniel)

O produto é do Daniel. Estes pontos de produto foram definidos na conversa com o dev e valem como ponto de partida até o Daniel confirmar.

| ID | Definição | Quem definiu | Fonte |
|---|---|---|---|
| D01 | Cidade piloto: Franca-SP | dev | conversa de 26/11/2026 |
| D02 | A v1 vende só produtos (alimentos, congelados, itens simples); serviços ficam para depois | dev | conversa de 26/11/2026 |
| D03 | Formas de pagamento da v1: Pix, cartão, saldo/cashback da carteira e pagamento na entrega/retirada | dev | conversa de 26/11/2026 |
| D04 | Entrega na v1: retirada, entrega do próprio produtor e entregador combinado por WhatsApp; perfil de entregador na v2 | dev | conversa de 26/11/2026 |
| D05 | Vini só em texto na v1 | dev | recomendação aceita na conversa |
| D06 | Afiliados na v1: indicação simples (link/código com cashback); sem rede de representantes | dev | conversa de 26/11/2026 |
| D07 | Operação do dia a dia pelo painel `/admin`, por Daniel e equipe | dev | conversa de 26/11/2026 |

## Decisões de trabalho do dev

Dizem respeito a como o dev conduz o trabalho, não ao produto.

| ID | Decisão | Fonte |
|---|---|---|
| D08 | O dono do projeto é o Daniel; o dev entrou para ajudar | conversa de 26/11/2026 |
| D09 | Design system com Impeccable fica **adiado** ("ainda não"); só mapear e organizar | conversa de 26/11/2026 |
| D10 | Segurança e checkout primeiro; organização do código em paralelo só nas frentes que não mexem em dinheiro | conversa de 26/11/2026 |
| D11 | Quando o design system começar: documentar e consolidar o que existe, sem redesenhar | conversa de 26/11/2026 |

## Abertas

| ID | Pergunta | Quem decide | Depende de | Ligação |
|---|---|---|---|---|
| A01 | Qual gateway usar (Asaas, Mercado Pago, Pagar.me)? | Daniel | tabelas vigentes e prova de conceito no sandbox | `comparativo-gateways.md` |
| A02 | Quem paga a tarifa do gateway (comprador, produtor ou Vitrinei)? | Daniel | A01 e A04 | `comparativo-gateways.md` |
| A03 | Como funciona o cashback na v1? | Daniel | A04 | `planos/afiliados-assinaturas-cashback.md` |
| A04 | Quais modelos de receita entram na v1 (taxa, assinatura do produtor, assinatura do consumidor)? | Daniel | conta de custo e margem | `mapa-da-ideia.md` |
| A05 | Como o Vitrinei ganha nos pedidos pagos na entrega/retirada? | Daniel | A04 | `mapa-da-ideia.md` |
| A06 | Quem são os primeiros produtores e como entram no catálogo? | Daniel | — | `mapa-da-ideia.md` |
| A07 | Qual o orçamento mensal de IA e o teto por usuário? | Daniel | consumo atual de créditos | `planos/ia-vini.md` |
| A08 | A Vitrinei pode receber e repassar o dinheiro dos produtores (custódia)? | contador e jurídico | — | `comparativo-gateways.md` |
| A09 | Regras e tributação das comissões de indicação | jurídico e contador | — | `planos/afiliados-assinaturas-cashback.md` |
| A10 | Continuar no Lovable Cloud ou migrar o backend e a IA para contas próprias? | Daniel | acessos | `planos/ia-vini.md` |
| A11 | De quem é o projeto Supabase e como o dev ganha acesso (GitHub, Supabase, Lovable)? | Daniel | — | `resumo-para-daniel.md` |
| A12 | Já existem pessoas reais cadastradas em produção? Se sim, avaliar com o jurídico se algo precisa ser comunicado | Daniel | A11 | `planos/seguranca.md` |
| A13 | Tema padrão no celular (Espacial escuro ou Comercial claro) e quantas fontes manter | Daniel | início do design system | `plano-organizacao-codigo.md` |
| A14 | O Vini continua sem se apresentar como IA? Hoje o código manda ele não dizer que é uma IA | Daniel, com o jurídico | — | `planos/ia-vini.md` |
