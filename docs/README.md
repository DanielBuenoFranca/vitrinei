# Documentação do Vitrinei

O Vitrinei é uma plataforma que conecta consumidores a produtores, microempreendedores e comerciantes locais, com um assistente de IA (o Vini), gestão financeira simples para quem vende e um programa de indicações. A v1 é o piloto em Franca-SP, só com produtos.

Estes documentos mapeiam a ideia, registram o que foi decidido e organizam os planos de ação. Nada aqui foi executado no código. Para achar um documento por tema ou sinônimo, use o `INDICE.toon`.

## Ordem de leitura

1. `mapa-da-ideia.md`: produto, perfis, módulos, jornadas, escopo v1 e depois.
2. `decisoes.md`: o que foi definido na conversa e o que está em aberto.
3. `roadmap.md`: as frentes de trabalho, a ordem e as dependências.
4. `planos/`: um plano por frente (segurança, comercial, IA, afiliados).
5. `diagnostico-v1.md` e `comparativo-gateways.md`: base de apoio.
6. `resumo-para-daniel.md`: texto pensado para o Daniel (dono do projeto).
7. `plano-organizacao-codigo.md`: organização do código e design system (a parte do Impeccable está adiada).

## Fontes brutas

`conversas-e-ideias` (requisito e recorte da v1) e `contexto.md` (tabela-resumo da avaliação do código) vieram do dev responsável e **não devem ser editados**. O `contexto.md` cita "ver abaixo" para a segurança, mas termina sem essa seção; o conteúdo está em `planos/seguranca.md` e em `resumo-para-daniel.md`.

## Convenções

- `> [!DECISAO]`: ponto definido na conversa com o dev, a confirmar com o Daniel.
- `> [!CONFIRMAR]`: dúvida em aberto; toda dúvida aparece em `decisoes.md`.
- Status no índice: `origem` (fonte bruta, não editar) ou `rascunho` (não validado). Tipo: `indice`, `ideia`, `decisoes`, `plano` ou `diagnostico`.
- "Usuário" é quem usa o app; "dev" é o dev responsável pela análise.
- Nada jurídico ou tributário aqui é validado: depende de contador e jurídico.
- Sem segredos, valores do `.env` nem dados pessoais nestes arquivos.

## Manutenção do índice

O `INDICE.toon` é mantido à mão (`gerado_por: manual`). Ao criar ou renomear um documento, atualize a linha dele e o campo `total`.
