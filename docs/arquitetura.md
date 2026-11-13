# Arquitetura

## Stack

- React 19 + React Router 8 em modo framework, com SSR (`react-router build`).
- Servidor de produção: Express 5 (`server.js` → `server-app.js`), igual ao Respawnou: define
  `NODE_ENV` antes de carregar o React, redireciona www → apex, aplica as migrations ao iniciar.
- Tailwind CSS 4 (tokens em `app/app.css`, tema "Dia e Noite").
- TypeScript estrito. Vite 8. Node 22+.
- MySQL (Hostinger) via `mysql2`. Migrations aplicadas pelo servidor ao iniciar.

## Pastas

```
app/
  root.tsx               layout: faixa de cotações + menu (noite), conteúdo (dia), rodapé (noite)
  routes.ts              mapa de rotas (editorias registradas uma vez por slug)
  routes/                páginas, ferramentas e resource routes (sitemap, rss, robots, ads.txt)
  components/            Header, Footer, cards, ToolLayout, StaticPage, RichText, ui
  lib/
    site.ts              configuração: editorias, ferramentas, páginas institucionais
    types.ts             Post, Coin, MonthlyPrice, MarketOverview, Broker
    money.ts             R$, %, valores compactos, leitura de número digitado, minigráfico
    tax.ts               regra do IR sobre cripto (calculadora)
    format.ts            datas no fuso America/Sao_Paulo
    seo.ts               title, description, canonical, Open Graph
    availability.ts      o que tem conteúdo (menu, home, sitemap, noindex)
    content.server.ts    API de dados usada pelas rotas
    repo/types.ts        contrato das fontes de dados
    repo/mock.server.ts  fonte em memória (mock-data.ts, tudo fictício)
    repo/mysql.server.ts fonte MySQL
    market/jobs.server.ts jobs de cotações e histórico (CoinGecko, alternative.me, AwesomeAPI)
db/migrate.mjs           aplica db/migrations/NNN_nome.sql
scripts/                 db-migrate, db-seed-dev (rodam com Node, sem build)
docs/                    este plano
```

## Rotas

| Endereço | Página |
|---|---|
| `/` | Home (destaque, BTC, vibe do mercado, ferramentas, cotações, notícias, guias) |
| `/noticias`, `/bitcoin`, `/altcoins`, `/mercado`, `/grana`, `/regulacao`, `/guias` | Editorias (Notícias = todas) |
| `/:editoria/:slug` | Matéria |
| `/cotacoes`, `/cotacoes/:moeda` | Tabela de mercado e página da moeda |
| `/ferramentas` e `/ferramentas/{conversor,calculadora-ir,simulador-aporte,comparador-corretoras}` | Ferramentas |
| `/busca` | Busca (matérias + moedas), `noindex` |
| `/sobre`, `/contato`, `/faq`, `/politica-editorial`, `/anuncie`, `/aviso-de-risco`, `/termos`, `/privacidade`, `/cookies`, `/acessibilidade`, `/mapa-do-site` | Institucionais e legais |

## Camada de dados

- Rotas só importam `content.server.ts`. Ele escolhe a fonte: **MySQL** se `DB_NAME` e `DB_USER`
  existirem; senão **mock** (dados de exemplo). As duas seguem a interface `Repo`.
- Só aparecem posts com `status = 'published'` e `published_at <= agora` (dá para agendar), e moedas
  com `active = 1` e cotação (`price_brl` não nulo).
- Moedas (`Coin`) trazem preço em reais e dólar, variação 24h/7d, valor de mercado, volume e a série
  de 7 dias do minigráfico. O histórico mensal (`MonthlyPrice`) alimenta o simulador.
- Rótulos relativos ("HÁ 3H") são calculados no servidor para evitar diferença de hidratação.
- Loaders que leem o endereço usam `routePath`/`firstSegment` (ignoram o sufixo `.data`; bug do
  Respawnou de 2026-11-12).

## Tema "Dia e Noite"

- Tokens da noite: `night`, `night-2/3`, `night-line(-2)`, `moon`, `moon-muted`, `glow` (detalhes da marca), `brand` (moeda), `lime` (dados e blocos),
  `up-night`, `down-night`. Do dia: `day`, `card`, `line(-2)`, `ink`, `muted`, `violet(-deep/-soft)`,
  `up`, `down`.
- Componentes no fundo escuro recebem a classe `night` (foco em lima) e `mode="night"` em
  `Change`, `Spark` e `Kicker`.
- Números de cotação usam `.num` (JetBrains Mono, algarismos de largura fixa).

## Variáveis de ambiente

| Variável | Uso | Fase |
|---|---|---|
| `VITE_SITE_URL` | URL canônica (build) | ✅ |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASSWORD` | MySQL | ✅ |
| `COINGECKO_API_KEY` | cotações, gráficos, histórico (chave Demo gratuita; funciona sem, com limite menor) | ✅ |
| `CRON_TOKEN` | protege `/api/cron/*` (mín. 24 caracteres) | ✅ |
| `GEMINI_API_KEY` | escrita das matérias (sem ela, o robô só registra "sem chave") | 3 |
| `ADMIN_EMAIL` `ADMIN_PASSWORD_HASH` `SESSION_SECRET` | login do /admin (`npm run admin:hash` gera o hash e o segredo) | 3 |
| `MEDIA_DIR` | pasta das imagens das matérias (padrão `~/vibecoin-media`, fora da pasta do app) | 3 |
| `ADSENSE_CLIENT` | liga AdSense, `ads.txt` e banner de cookies | 4 |

Modelo em `.env.example`. O `.env` real nunca vai para o Git (repositório público).
