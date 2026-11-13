# Cotações e dados de mercado

Tudo vem de APIs gratuitas, gravado no MySQL por um job e lido pelo site (nenhuma página chama API
de fora: se uma fonte cair, o site mostra o último valor).

## Fontes

| Dado | Fonte | Chave |
|---|---|---|
| Preço em reais e dólar, variação 24h/7d, valor de mercado, volume, ranking, série de 7 dias | CoinGecko `/coins/markets` | `COINGECKO_API_KEY` (Demo, grátis) — funciona sem, com limite menor |
| Valor de mercado total, dominância do BTC | CoinGecko `/global` | idem |
| Histórico mensal (simulador) | CoinGecko `/coins/{id}/market_chart?days=365` | idem |
| Índice de medo e ganância | alternative.me `/fng` | não precisa |
| Dólar comercial (USD/BRL) e variação | AwesomeAPI `/json/last/USD-BRL`; reserva: BTC em reais ÷ BTC em dólar (CoinGecko) + variação pelo registro próprio de 26 h (`settings.usd_brl_log`) | não precisa |

Cuidados descobertos nos testes:

- A série de 7 dias (`sparkline_in_7d`) vem **sempre em dólar**, mesmo pedindo reais. Para o
  minigráfico basta o desenho: o job reduz a ~42 pontos e converte pela razão preço em reais / último
  ponto (`sparkToBrl`).
- O plano gratuito só entrega **365 dias** de histórico. O simulador começa com 12 meses e ganha um
  mês a cada mês que passa (o job guarda cada fechamento em `coin_history`).
- Sem chave, a API pública devolve 429 rápido. O job espera o tempo pedido e tenta de novo (até 2x);
  o histórico vai em doses de 3 moedas por execução, com 2,5 s entre chamadas.

## Jobs

| Rota | Quando | O que faz |
|---|---|---|
| `/api/cron/cotacoes?token=...` | Cron Job da Hostinger **a cada 15 min** | preços das moedas ativas + panorama + medo e ganância + dólar; histórico atrasado de até 3 moedas |
| `/api/cron/historico?token=...` | manual | histórico de todas as moedas atrasadas |
| `/api/cron/status?token=...` | manual | últimas execuções (`cron_runs`) |

Respondem 202 e rodam em segundo plano (a CDN da Hostinger corta em ~1 min); `wait=1` espera o fim.
Sem `CRON_TOKEN` (mín. 24 caracteres), sem banco ou com token errado: 404.

Consumo da CoinGecko: 3 chamadas a cada 15 min (~8.600/mês) + ~20 de histórico por mês, dentro das
10 mil/mês do plano Demo. Se precisar de folga, passar o cron para 20 min.

## Moedas acompanhadas

As 20 da migration 001: BTC, ETH, USDT, XRP, BNB, SOL, USDC, DOGE, ADA, TRX, LINK, AVAX, XLM, TON,
SHIB, DOT, LTC, BCH, SUI, UNI. Para incluir outra: `INSERT` em `coins` com `slug`, `gecko_id` (o id
da CoinGecko), `symbol`, `name`, `description` (pt-BR) e `stable`. A cotação aparece na coleta seguinte.
Para tirar do site: `active = 0`.
