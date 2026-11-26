# Deploy na Hostinger

> **Histórico:** o site saiu da Hostinger gerenciada em 2026-11-26 e roda na VPS; ver [deploy-vps.md](deploy-vps.md).

Status: ✅ no ar desde 2026-11-13 em https://vibecoin.com.br (banco vazio, aguardando a primeira matéria)

## Como está configurado

| Item | Valor |
|---|---|
| Site | `vibecoin.com.br`, no mesmo plano Business do Respawnou (ids da conta fora do repositório, que é público: consultar com `hosting_websites_list` pelo MCP) |
| Deploy | GitHub `evssousa/vibecoin`, branch `main`, **auto-deploy a cada push** |
| Build | Node 24, `npm install` + `npm run build`, app type `express`, entrada `server.js` |
| Entrada | `server.js` (define NODE_ENV) → `server-app.js` (Express + migrations) |
| Banco | MySQL `<usuário>_vibecoin` em `127.0.0.1:3306` (só acesso local); migrations aplicadas a cada início |
| Variáveis | `VITE_SITE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `CRON_TOKEN` (cadastradas pelo Claude via MCP em 2026-11-13); `COINGECKO_API_KEY` cadastrada pelo dono no hPanel (2026-11-13) — **daqui em diante, variáveis só pelo hPanel** |
| Cron Job | `7,22,37,52 * * * *` → `curl -s -m 50 -o /dev/null "https://vibecoin.com.br/api/cron/cotacoes?token=…"` (desencontrado dos jobs do Respawnou) |
| SSL | Let's Encrypt (Hostinger); HTTP → HTTPS pela Hostinger; `www` → apex pelo `server-app.js` (301) |

## Cuidados

As armadilhas do Respawnou valem aqui (ver o `deploy-hostinger.md` dele). As mais importantes:

1. **Variáveis pelo MCP substituem a lista inteira** (`hosting_nodejs_replace-environment-variables`).
   Depois que o dono cadastrar a `COINGECKO_API_KEY` no hPanel, **não usar mais essa operação**: a
   chave não está com o Claude e seria apagada. Mudanças de variáveis passam a ser feitas no hPanel.
2. Não colocar `NODE_ENV` nas variáveis do painel.
3. A CDN corta requisições com mais de ~55 s: os jobs respondem 202 e rodam em segundo plano.
4. Logs: `hosting_nodejs_runtime-logs` (console do app) e `hosting_get-deployment` (build).
5. **IP compartilhado e APIs gratuitas:** a AwesomeAPI (dólar) respondeu 429 ao servidor no primeiro
   dia. O job tem reserva: dólar implícito pela CoinGecko (BTC em reais ÷ BTC em dólar) e variação
   pelo registro próprio de 26 h (`settings.usd_brl_log`).

## Pendente

- E-mail `contato@vibecoin.com.br`.
- Google Search Console + sitemap: esperar as primeiras matérias, como no Respawnou.
