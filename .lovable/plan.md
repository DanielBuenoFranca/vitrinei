A solicitação consiste em permitir a ordenação de grids ao clicar no cabeçalho das colunas.

Para implementar isso de forma consistente em todo o sistema:

1. Identificar os componentes de tabela (`src/components/ui/table.tsx` e as tabelas existentes em `src/components/admin/`).
2. Criar um utilitário de ordenação ou adaptar as tabelas para suportarem ordenação local (estado `sortConfig` contendo `key` e `direction`).
3. Adicionar lógica de `sort` aos componentes `CardexPanel`, `CrmPanel`, e outros que exibam dados em grid.

Como os componentes de tabela atuais usam `@/components/ui/table`, eles são componentes renderizados puramente. A lógica de ordenação precisa ser implementada nos componentes de tela (pai) ou em um componente de tabela "Smart" que encapsule a lógica de ordenação.

Plano:
1. Criar um componente `SortableTable` ou atualizar `CardexPanel` e `CrmPanel` para gerenciar estado de ordenação local.
2. Atualizar o `TableHeader` nessas telas para incluir um cursor `pointer` e um ícone de indicação de ordenação.
3. Implementar a função `handleSort(key)` que altera o estado `sortConfig` e ordena o array de dados `filtered`.
4. Verificar se a ordenação precisa ser refletida no banco de dados ou se a ordenação local é suficiente (para o Cardex, ordenação local parece suficiente e rápida).

Vou começar atualizando o `CardexPanel` como prova de conceito.