# Ferramentas

Todas rodam no navegador (sem cadastro), com os dados que o loader entrega. Cada uma só aparece se
tiver dados (ver `getAvailability()` e decisoes.md).

## Conversor (`/ferramentas/conversor`)

- Cripto → reais e reais → cripto, com a cotação de referência.
- `?moeda=solana` abre já com a moeda (a página de cada moeda linka assim).
- Aceita número no formato brasileiro (`1.234,56`, `0,05`) — `parseNumber` em `money.ts`.
- **Dados:** preço em reais das moedas (`Coin.priceBrl`). Fase 1: CoinGecko, atualizado por cron.

## Calculadora de IR (`/ferramentas/calculadora-ir`)

- Entrada: total vendido no mês e custo de compra do que foi vendido.
- Regra (`app/lib/tax.ts`), para corretoras brasileiras, pessoa física:
  - isento se o total vendido no mês ≤ R$ 35.000;
  - acima: imposto sobre o lucro, 15% até R$ 5 mi, 17,5% até R$ 10 mi, 20% até R$ 30 mi, 22,5% acima
    (progressivo por faixa);
  - DARF código 4600 até o último dia útil do mês seguinte.
- Exterior (Lei 14.754/2023, 15% ao ano na declaração) fica fora, explicado no texto da página.
- `RULES_CHECKED_AT` aparece na página. **Antes de publicar e a cada mudança de lei: conferir a regra
  na Receita Federal e atualizar a data.**

## Simulador de aporte (`/ferramentas/simulador-aporte`)

- Compra todo mês o valor escolhido pelo fechamento daquele mês; mostra total investido, quantidade
  acumulada, valor hoje, resultado e o gráfico carteira × investido.
- Sem taxas nem imposto (dito na página). Stablecoins ficam de fora.
- **Dados:** `MonthlyPrice[]` por moeda, mínimo de 12 meses. Fase 1: histórico da CoinGecko
  (`/coins/{id}/market_chart?vs_currency=brl`), guardado no MySQL e atualizado uma vez por mês.

## Comparador de corretoras (`/ferramentas/comparador-corretoras`)

- Tabela: maker, taker, depósito e saque por Pix, número de moedas, recursos e data da conferência.
- Ordem alfabética; o site não recebe comissão (dito na página e no FAQ).
- **Dados:** cadastrados à mão no painel (fase 3), conferidos no site de cada corretora, com data. Os
  dados de exemplo usam nomes fictícios ("Corretora Exemplo A") e nunca vão para produção.
