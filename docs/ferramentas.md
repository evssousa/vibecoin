# Ferramentas

Todas rodam no navegador (sem cadastro), com os dados que o loader entrega. Cada uma só aparece se
tiver dados (ver `getAvailability()` e decisoes.md).

## Conversor (`/ferramentas/conversor`)

- Cripto → reais e reais → cripto, com a cotação de referência.
- `?moeda=solana` abre já com a moeda (a página de cada moeda linka assim).
- Aceita número no formato brasileiro (`1.234,56`, `0,05`) — `parseNumber` em `money.ts`.
- **Dados:** preço em reais das moedas (`coins.price_brl`), atualizado a cada 15 min (ver cotacoes.md).

## Calculadora de IR (`/ferramentas/calculadora-ir`)

- Entrada: total vendido no mês e custo de compra do que foi vendido.
- Regra (`app/lib/tax.ts`), para corretoras brasileiras, pessoa física:
  - isento se o total vendido no mês ≤ R$ 35.000;
  - acima: imposto sobre o lucro, 15% até R$ 5 mi, 17,5% até R$ 10 mi, 20% até R$ 30 mi, 22,5% acima
    (progressivo por faixa);
  - DARF código 4600 até o último dia útil do mês seguinte.
- Exterior (Lei 14.754/2023, 15% ao ano na declaração) fica fora, explicado no texto da página.
- `RULES_CHECKED_AT` aparece na página. **A cada mudança de lei: conferir a regra na Receita Federal e
  atualizar a data.**
- Conferida em **2026-11-13**: a MP 1.303/2025 (alíquota única de 17,5% e fim da isenção) caducou em
  8/10/2025 sem votação; nenhum projeto a retomou até agora. Valem a isenção de R$ 35 mil e as faixas de
  15% a 22,5%. A DeCripto (IN RFB 2.291/2025, obrigatória desde julho de 2026) só informa operações, não
  muda o imposto. A página explica os dois pontos (são buscas comuns). Fontes: Exame, Mercado Bitcoin,
  Contábeis, Mattos Filho (notícias de 2025–2026); a página oficial da Receita não apareceu na busca.

## Simulador de aporte (`/ferramentas/simulador-aporte`)

- Compra todo mês o valor escolhido pelo fechamento daquele mês; mostra total investido, quantidade
  acumulada, valor hoje, resultado e o gráfico carteira × investido.
- Sem taxas nem imposto (dito na página). Stablecoins ficam de fora.
- "Valeria hoje" = quantidade acumulada × cotação de agora (o histórico só tem meses fechados).
- **Dados:** `coin_history` (fechamento mensal), mínimo de 12 meses para a moeda aparecer. Vem da
  CoinGecko gratuita, que só dá 365 dias: começa com 12 meses e cresce um por mês (ver cotacoes.md).

## Comparador de corretoras (`/ferramentas/comparador-corretoras`)

- Tabela: maker, taker, depósito e saque por Pix, número de moedas, recursos e data da conferência.
- Ordem alfabética; o site não recebe comissão (dito na página e no FAQ).
- **Dados:** cadastrados à mão no painel (fase 3), conferidos no site de cada corretora, com data. Os
  dados de exemplo usam nomes fictícios ("Corretora Exemplo A") e nunca vão para produção.
