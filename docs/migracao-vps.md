# Migração para a VPS (Hostinger KVM 1 + Coolify)

Status: 🔄 **em preparação** (2026-11-26). 3º site a migrar (criasite e respawnou viraram em 2026-11-26).
Módulo de origem: `../criasite/docs/migracao-vps.md`, Partes B a F e "Lições do criasite"; cópia mais recente e
com a lição do middleware 301 em `../respawnou/docs/migracao-vps.md`. A Parte A (base da VPS) já está feita e **não se repete**.

Marcadores: `<site>` = `vibecoin`; `<dominio>` = `vibecoin.com.br`; `<repo>` = `evssousa/vibecoin`;
`<temp>` = `vibecoin.189-24-17-85.sslip.io`. 🤖 = Claude, 👤 = dono.

## O que já existe na VPS (da Parte A do criasite)

Coolify em `https://painel.criasite.app` (token da API em `projetos\_segredos\coolify-api-token.txt`), GitHub App
`coolify-sites-evssousa` (uuid `ewmvhkc4kociuvhqgsl5paz0`), servidor `rfc2imocy7zydxlver01wlsx`, MariaDB 11.8
`mariadb-sites` (uuid `djg6eojhrivnayhax7ohoszd` = `DB_HOST`, backup diário de todos os bancos), firewall da Hostinger,
swap de 4 GB, SSH root só por chave (`~/.ssh/criasite_vps`), pastas `/srv/sites` e `/root/migracao`.
Memória em 2026-11-26, com criasite e respawnou no ar: 1,69 GB usados de 3,9 GB (2,2 GB disponíveis); disco 31%.

---

## Parte F — Específico do vibecoin (levantado em 2026-11-26)

- **Hoje:** app Node (React Router 8 SSR + Express 5) no Cloud Startup, atrás da CDN (`vibecoin.com.br.cdn.hstgr.net`),
  auto-deploy do GitHub `evssousa/vibecoin` (main), MySQL local. Imagens em `~/vibecoin-media` (padrão do
  `server-paths.mjs`; sem `MEDIA_DIR` no painel), só no padrão `AAAA/MM/<nome>.webp`. Última migration: `013_texto_das_cotacoes`.
- **Variáveis na Hostinger (12):** `VITE_SITE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
  `CRON_TOKEN`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `GEMINI_API_KEY`, `COINGECKO_API_KEY`.
  Não existem: `GEMINI_MODEL`, `ADSENSE_CLIENT`, `DB_POOL`, `MEDIA_DIR`.
- **Cron Jobs do vibecoin (3):** `7,22,37,52 * * * *` cotacoes, `15,45 * * * *` coletar, `25 * * * *` publicar (com
  `?token=` na URL). Na mesma lista da conta há 1 do animeprofile (`*/5` tick): **não mexer** nele.
  Não batem com os da VPS (criasite `10,40`/`50`; respawnou `0,30`/`5`): os horários ficam iguais.
- **DNS (para a volta):** `@` ALIAS `vibecoin.com.br.cdn.hstgr.net.` (TTL 300); `www` CNAME
  `www.vibecoin.com.br.cdn.hstgr.net.` (TTL 300). Sem CAA. Ficam intocados: MX (`mx1`/`mx2.hostinger.com`), TXT do
  SPF e da verificação do Google (`google-site-verification=CXWC6…`), `_dmarc`, os 3 DKIM `hostingermail-*`,
  `autodiscover`, `autoconfig`. O `ftp` (A `187.6.160.61`) some quando o site antigo for apagado (igual aos irmãos).
- **E-mail:** `contato@vibecoin.com.br` continua na Hostinger (a virada não mexe no MX). Conferir de qual pedido ele é
  antes de apagar o site antigo (no respawnou era um "Free Business Email" separado).
- **Diferenças em relação ao criasite:**
  1. **Cotações a cada 15 min** (CoinGecko): no ensaio o job `cotacoes` só roda à mão (escreve na cópia do banco, sem
     problema). A chave `COINGECKO_API_KEY` é a mesma de hoje.
  2. Sem ffmpeg, sem Instagram: memória do app **768 MB**, `cpu_shares` padrão.

---

## Parte B — Preparar o site na VPS

### B1. Levantamento 🤖 ✅
Parte F acima.

### B2. Código: Dockerfile e comentários 🤖
`Dockerfile` igual ao do criasite, com `VITE_SITE_URL=https://vibecoin.com.br`; `.dockerignore` igual. Comentários:
`server.js`, `server-paths.mjs`, `server-app.js` (`prepareDatabase`), `app/lib/db.server.ts`, `app/routes/cron.ts`,
`.env.example`. `npm run build` antes do commit.
- **Conferir:** deploy da Hostinger depois do push termina `completed` e o site segue igual.

### B3. Variáveis 🤖 + 👤
| Variável | Valor na VPS | Quem |
|---|---|---|
| `DB_HOST` | `djg6eojhrivnayhax7ohoszd` | 🤖 |
| `DB_PORT` | `3306` | 🤖 |
| `DB_NAME`, `DB_USER` | `vibecoin` | 🤖 |
| `DB_PASSWORD` | nova, gerada | 🤖 |
| `CRON_TOKEN` | novo (64 hex) | 🤖 |
| `SESSION_SECRET` | novo (desloga o admin, ok) | 🤖 |
| `VITE_SITE_URL` | `https://vibecoin.com.br`, **Build Variable** | 🤖 |
| `ADMIN_EMAIL` | o mesmo de hoje | 👤 |
| `ADMIN_PASSWORD_HASH` | o de hoje ou um novo (`npm run admin:hash`) | 👤 |
| `GEMINI_API_KEY`, `COINGECKO_API_KEY` | os mesmos de hoje | 👤 |
| `MEDIA_DIR`, `PORT`, `NODE_ENV` | no Dockerfile; não cadastrar | — |

Arquivo `projetos\_segredos\vibecoin-vps.env` gerado pelo 🤖 sem imprimir; o 👤 preenche as 4 linhas vazias no Bloco de
Notas. Envio por script que não mostra valores (`PATCH /applications/{uuid}/envs/bulk`, `is_buildtime` só na `VITE_SITE_URL`).

### B4. Banco e usuário 🤖
`/root/migracao/vibecoin.env` (scp, chmod 600) → `CREATE DATABASE vibecoin` utf8mb4 + usuário `vibecoin`@`%` só com
`vibecoin.*`.

### B5. Ensaio do banco 👤 + 🤖
1. 👤 phpMyAdmin do hPanel (banco do vibecoin) → anotar a versão do servidor → Exportar → **Personalizado**: SQL; todas as
   tabelas; estrutura e dados; desmarcar "CREATE DATABASE / USE"; `utf8mb4`; sem compressão. Salvar em
   `projetos\_migracao\vibecoin-ensaio.sql`.
2. 🤖 scp; conferir cabeçalho, `USE`, `CREATE DATABASE`, `DEFINER`, `uca1400`; `DROP DATABASE` + `CREATE DATABASE`
   (o phpMyAdmin não põe `DROP TABLE`) e importar.
3. 🤖 Contagens para comparar na virada: `posts`, `coins`, `feeds`, `feed_items`, `cron_runs`, `settings`, `visit_*`;
   `schema_migrations` = `013_texto_das_cotacoes`.

### B6. Ensaio das imagens 🤖
`grep -oE '/media/20[0-9]{2}/[0-9]{2}/[A-Za-z0-9._-]+' vibecoin-ensaio.sql | sort -u`, baixar de
`https://vibecoin.com.br` para `/srv/sites/vibecoin/media`, `chown -R 1000:1000`.
- **Conferir:** arquivos = linhas da lista menos as `FALHOU` explicadas (404 também no site antigo); `du -sh` anotado.

### B7. Aplicação no Coolify 🤖 (API)
Projeto `vibecoin` → app do repositório `evssousa/vibecoin` (GitHub App), branch `main`, build pelo Dockerfile, porta
3000, healthcheck `/robots.txt`, memória 768 MB, domínio só `https://<temp>` com `noindex_domains`, pasta
`/srv/sites/vibecoin/media` → `/data/media` (storage `file` + `is_directory`), variáveis do B3. **Sem** tarefas agendadas.
**Logo depois de criar:** rótulos próprios com `redirect-to-https.redirectscheme.permanent=true` (lição 13 do criasite:
senão todo http da VPS dá 503) e conferir `curl -sI http://criasite.app/x` → 301 e o proxy sem `ERR`.
- **Conferir:** log `[migrate] banco atualizado` e `[vibecoin] ouvindo na porta 3000`; healthy; tempo de build e memória.

### B8. Tarefas agendadas (criar só na virada)
| Nome | Cron (UTC) | Comando |
|---|---|---|
| cotacoes | `7,22,37,52 * * * *` | `sh -c 'curl -fsS -m 280 -H "x-cron-token: $CRON_TOKEN" http://127.0.0.1:3000/api/cron/cotacoes'` |
| coletar | `15,45 * * * *` | `sh -c 'curl -fsS -m 280 -H "x-cron-token: $CRON_TOKEN" http://127.0.0.1:3000/api/cron/coletar'` |
| publicar | `25 * * * *` | `sh -c 'curl -fsS -m 280 -H "x-cron-token: $CRON_TOKEN" http://127.0.0.1:3000/api/cron/publicar'` |

### B9. Checklist do ensaio em `https://vibecoin.189-24-17-85.sslip.io` 🤖
1. **Páginas (200 e conteúdo real):** `/`, `/noticias`, 1 notícia, as editorias (`/bitcoin`, `/altcoins`, `/mercado`,
   `/regulacao`), `/cotacoes` e 2 moedas (com o texto próprio da migration 013), `/guias` e 1 guia, `/ferramentas` e as
   calculadoras/comparador, `/busca?q=bitcoin`, `/anuncie`, `/privacidade`; uma página inexistente dá 404; títulos da home
   iguais aos do site antigo.
2. **SEO:** `<loc>` do sitemap igual ao antigo (121 em 2026-11-25); `/robots.txt` igual; canonical em `https://vibecoin.com.br/…`.
3. **/media:** a lista inteira com 200 e `immutable`.
4. **Cabeçalhos:** Brotli/gzip no HTML; `/assets/*` immutable; `/admin` e `/api` com `no-store` e noindex.
5. **/admin** (👤): login; `/admin/materias`, `/admin/robo`, `/admin/visitas`. Não editar nada que precise sobreviver.
6. **Robô (dentro do container):** `diag?wait=1` (Gemini), `cotacoes?wait=1` (CoinGecko), `coletar?wait=1`,
   `publicar?dry=1&wait=1`, `status`.
7. **Visitas:** 2 páginas abertas → `/admin/visitas` "Hoje" sobe.
8. **http → https** (301); **tempo** (TTFB da home 5×, comparar com o antigo).
9. **Deploy sem queda** (push com `curl` a cada segundo) e **reinício** (`docker restart`).
10. **Recursos:** `free -m`, `docker stats --no-stream`.

---

## Parte C — Virada

Começar aos **:53** de uma hora (depois do `cotacoes` das :52; o próximo é às :07, o `coletar` às :15 e o `publicar` às :25).

| # | Quem | Passo | Conferir |
|---|---|---|---|
| C1 | 🤖 | Snapshot da VPS. Avisar o dono: não editar nada no `/admin` antigo | snapshot criado |
| C2 | 🤖 | **Apagar só os 3 Cron Jobs do vibecoin** na Hostinger (`wxTYeBl6ZA` cotacoes, `sss609XWLm` coletar, `ZvJpMjbz19` publicar); o do animeprofile fica | lista da conta só com o do animeprofile |
| C3 | 🤖 | Esperar terminar o último job antigo | `status` antigo sem job aberto |
| C4 | 👤 | Dump final pelo phpMyAdmin → `projetos\_migracao\vibecoin-final.sql` | avisar no chat |
| C5 | 🤖 | scp; `DROP DATABASE` + `CREATE DATABASE`; importar; contagens ≥ ensaio | migration 013 |
| C6 | 🤖 | Imagens novas (B6 com o dump final) | 0 `FALHOU` novos |
| C7 | 🤖 | restart; B9 itens 1, 3 e 5 | ok |
| C8 | 🤖 | **DNS:** apagar `@` ALIAS e `www` CNAME; criar `A 189.24.17.85` nos dois (TTL 300). Sem AAAA | `nslookup` no 8.8.8.8 e 1.1.1.1 = VPS |
| C9 | 🤖 | Domínios `https://vibecoin.com.br`, `https://www.vibecoin.com.br` (+ o temporário com noindex); deploy; rótulos 301 | Let's Encrypt para os dois; `http://criasite.app/x` segue 301 |
| C10 | 🤖 | Checklist no domínio real (B9 1–4, 8; http→https e www→apex com 301; MX igual) | ok |
| C11 | 🤖 | Criar as 3 tarefas (B8) | `cotacoes`, `coletar` e `publicar` rodam sozinhos no horário |
| C12 | 👤 | Abrir o site e o `/admin` no celular e no PC | dono confirma |

## Parte D — Depois da virada
- **2 h** 🤖: `cotacoes`/`coletar`/`publicar` no `status`; cotações atualizando na home; 1 matéria nova com capa servida
  da VPS; `docker logs` sem erro; `free -m`.
- **24 h** 🤖: backup diário inclui o banco `vibecoin`; visitas contando.
- **7 dias** 🤖: TTL 3600; tirar o temporário; apagar `/root/migracao/vibecoin*` e 👤 `projetos\_migracao\vibecoin-*.sql`;
  `deploy-vps.md` novo, `deploy-hostinger.md` vira histórico.
- **Site antigo:** apagar do Cloud Startup (`hosting_websites_delete`) **só com o ok do dono**, depois de conferido o
  domínio real. Logo depois, conferir a zona (A da VPS, MX, SPF, DKIM, DMARC, TXT do Google) e a caixa de e-mail.

## Parte E — Volta (enquanto o site antigo existir)
1. 🤖 DNS de volta: `@` ALIAS `vibecoin.com.br.cdn.hstgr.net`, `www` CNAME `www.vibecoin.com.br.cdn.hstgr.net`, TTL
   300; apagar os A.
2. 🤖 Apagar as tarefas do Coolify.
3. 👤 Recriar os 3 Cron Jobs no hPanel (horários da Parte F, com o token **antigo**, que continua no app antigo).
4. 🤖 Listar o que a VPS gravou depois do C4 (posts, edições) para o dono decidir.

---

## Andamento

**2026-11-26 (Claude)**
- B1: levantamento feito (Parte F).
- B2: `Dockerfile`, `.dockerignore` e comentários; `npm run build` ok (commit `2381fea`).
- B3: `projetos\_segredos\vibecoin-vps.env` gerado (DB, `CRON_TOKEN`, `SESSION_SECRET` novos); as 8 geradas já estão no
  app. Faltam as 4 linhas do dono (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `GEMINI_API_KEY`, `COINGECKO_API_KEY`).
- B4: banco e usuário `vibecoin` criados (grants só em `vibecoin.*`).
- B7: projeto `vibecoin` (uuid `idadw2mjhi6fx9pvf0dnozco`), app `vibecoin` (uuid **`tovkdkbzipk7pjzfaqb21ei3`**),
  Dockerfile, porta 3000, healthcheck `/robots.txt`, 768 MB, domínio só o temporário com noindex, pasta
  `/srv/sites/vibecoin/media` → `/data/media`. Rótulos próprios com `redirect-to-https…permanent=true` **antes** do 1º
  deploy (depois do PATCH a API devolve `custom_labels` em base64). 1º deploy: healthy em ~35 s, imagem de 545 MB, as 13
  migrations rodaram no banco vazio (o dump do ensaio substitui tudo). `http://` de criasite, respawnou e do temporário
  seguem 301 (com `curl -I`/HEAD o Traefik responde 308; com GET, 301); proxy sem `ERR`.
- **Esperando o dono:** preencher o `.env` e o dump do ensaio (B5.1).

**2026-11-26, ensaio (Claude; dono preencheu o `.env` e fez o dump)**
- B3: as 12 variáveis no app. Atenção: variável nova só entra no container com **deploy** (o `docker restart` não basta).
- B5: origem `11.8.9-MariaDB-log` (igual ao alvo). Dump de 7,7 MB, sem `USE`/`CREATE DATABASE`/`DEFINER`/`uca1400`/
  `DROP TABLE`; importado em 2 s: 89 posts (todos publicados, o mais novo de 17:27 UTC), 20 coins, 16 feeds, 4.453
  feed_items, 2.321 cron_runs, 8 settings, visit_daily 5, visit_pages 7, visit_dims 25; migration 013.
- B6: 219 caminhos `/media/AAAA/MM/`, 219 baixados (23 MB), nenhuma falha.
- B9 ✅: 17 páginas (editorias, cotações com o texto próprio, guias, 4 ferramentas, busca, anuncie, privacidade, cookies)
  com 200 e 404 certo; 8 matérias com 200; sitemap 134 = 134 (mesmas URLs); `robots.txt` igual; canonical
  `https://vibecoin.com.br/`; títulos da home iguais; 219/219 imagens com `immutable`; HTML em Brotli; `/assets` immutable;
  `/admin` e `/api` com `no-store` e noindex; http → https 301. Robô: `diag` ok (Gemini), `cotacoes` ok (20 moedas),
  `coletar` ok (5 novos, 0 erros), `publicar?dry=1` avaliou e descartou 2 pautas repetidas (filtro de repetidas ok).
  TTFB da home 0,22 s na VPS contra 0,33 s na Hostinger. Deploy sem queda: 1º redeploy 42×200 e 1 falha de conexão na
  troca; 2º redeploy 78×200. RAM: app 65 MB; VPS com 2,4 GB usados e 1,5 GB disponíveis (o respawnou estava em 631 MB).
- **Observação:** a `economia.awesomeapi.com.br` responde **429 para o IP da VPS** (do PC do dono dá 200). O código já
  cai no dólar derivado da CoinGecko (R$ 5,7468 no teste); perde só a variação exata do dólar no dia (usa o histórico
  guardado). Ver depois da virada se continua; se continuar, trocar a fonte do dólar (Parte D).
- Falta do ensaio (dono): entrar no `/admin` do endereço temporário e ver `/admin/visitas` "Hoje" subir.
