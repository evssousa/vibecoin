# Banco de dados

MySQL 8 / MariaDB 10.6+ (Hostinger). Charset `utf8mb4`, collation `utf8mb4_unicode_ci`.
Datas em UTC.

## Migrations

| Arquivo | Conteúdo | Rodada na Hostinger? |
|---|---|---|
| `db/migrations/001_inicial.sql` | Estrutura inicial (tabelas abaixo), configurações padrão e as 20 moedas acompanhadas | ⏳ automática no primeiro deploy |

Como aplicar:

- **Produção:** automático. O `server-app.js` aplica as migrations pendentes toda vez que o app
  inicia (o MySQL da Hostinger só aceita conexão local). Basta commitar o arquivo novo e dar push.
- **Local:** configurar `DB_*` no `.env` e rodar `npm run db:migrate`.
- **Pelo phpMyAdmin:** colar o conteúdo de cada arquivo, em ordem.
- Toda migration nova é colada no chat quando criada (combinado com o dono do projeto).

Dados de exemplo para desenvolvimento: `npm run db:seed-dev` (apaga matérias, histórico e corretoras
e desativa as moedas reais; bloqueado com `NODE_ENV=production`).

## Tabelas

| Tabela | Para quê | Campos importantes |
|---|---|---|
| `posts` | Matérias | `section`+`slug` únicos, `status` (draft/published/archived), `origin` (auto/manual), `coins` JSON (slugs citados), `level` (guias), `body` JSON em blocos, `published_at` (UTC), `meta_description`, `focus_keyword`, `tags` JSON |
| `coins` | Moedas acompanhadas e a cotação do momento | `slug` (endereço), `gecko_id` (CoinGecko), `stable`, `active`, `price_brl` (NULL = ainda sem cotação: não aparece), `change_24h`/`change_7d`, `spark_7d` JSON, `quoted_at` |
| `coin_history` | Fechamento mensal em reais (simulador) | PK `(coin_id, month)`, `month` = AAAA-MM |
| `brokers` | Comparador de corretoras (dados conferidos à mão) | `slug` único, taxas, Pix, `features` JSON, `checked_at` |
| `feeds` / `feed_items` | Fontes RSS e fila de pautas do robô (fase 3) | como no Respawnou |
| `cron_runs` | Histórico dos jobs | `job`, `status`, `message`, `stats` JSON |
| `settings` | Configurações e valores calculados | `market` (panorama: valor de mercado, dominância, dólar, medo e ganância), `posts_per_day`, `robot_enabled` |
| `schema_migrations` | Controle das migrations (criada pelo `db/migrate.mjs`) | `version` |

## Formato dos campos JSON

```jsonc
// posts.body — em p/ul/ol/quote o texto aceita links [texto](url) ("/..." = interno)
[{ "type": "p", "text": "... [cotação do bitcoin](/cotacoes/bitcoin) ..." },
 { "type": "h2", "text": "..." }, { "type": "ul", "items": ["..."] },
 { "type": "img", "src": "/media/2026/11/slug-1a2b.webp", "alt": "...", "credit": "Imagem: ..." },
 { "type": "p", "text": "Leia também: [Título](/bitcoin/slug)" }]

// coins.spark_7d — ~42 preços em reais, do mais antigo ao mais novo
[401200.5, 402950.1, ...]

// settings.market
{ "totalMarketCapBrl": 13567323361923, "change24h": -5.27, "btcDominance": 59.4,
  "usdBrl": 5.64, "usdBrlChange24h": 1.05,
  "fearGreed": { "value": 28, "yesterday": 29, "label": "Medo" }, "updatedAt": "2026-11-12T23:49:09Z" }
```

## Testes feitos (2026-11-12)

MySQL 8.4 descartável (`mysql-memory-server`):

- migration 001 aplicada pelo próprio servidor ao iniciar;
- banco vazio: home com "aguardando a primeira matéria", cotações/conversor/simulador fora (404),
  só a calculadora de IR; `/api/cron/*` com token errado → 404;
- job `cotacoes` real: 20 moedas, panorama, medo e ganância e dólar gravados;
- job `historico` real: 12 fechamentos mensais por moeda (18 moedas, sem as stablecoins);
- `db:seed-dev` + comparação com a versão mock: mesmas matérias na mesma ordem em home, editorias,
  paginação, matéria, moeda, busca e mapa do site.
