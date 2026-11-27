# Deploy na VPS (Coolify)

Status: ✅ no ar na VPS desde **2026-11-26** (virada às 14:41–14:55 de Brasília). Antes: Hostinger Cloud Startup
([deploy-hostinger.md](deploy-hostinger.md), agora histórico). Plano e andamento completos: [migracao-vps.md](migracao-vps.md).

| Item | Valor |
|---|---|
| Servidor | VPS Hostinger KVM 1 (1 vCPU, 4 GB, swap 4 GB), Ubuntu 24.04, IPv4 `189.24.17.85` (sem AAAA), compartilhada com criasite e respawnou |
| Painel | Coolify 4 em `https://painel.criasite.app` (2FA). Acesso de emergência: SSH root só por chave |
| App | projeto `vibecoin` → app `vibecoin` (uuid `tovkdkbzipk7pjzfaqb21ei3`), build pelo `Dockerfile`, porta 3000, healthcheck `/robots.txt`, 768 MB |
| Deploy | **auto-deploy a cada push** na `main` (GitHub App `coolify-sites-evssousa`), troca sem queda |
| Domínios | `https://vibecoin.com.br` (principal), `https://www.vibecoin.com.br` (301), `https://vibecoin.189-24-17-85.sslip.io` (ensaio, noindex; tirar em 7 dias) |
| SSL | Let's Encrypt pelo Traefik do Coolify, renovação automática |
| Banco | MariaDB 11.8 compartilhado `mariadb-sites` (projeto `bancos`), banco e usuário `vibecoin`; `DB_HOST` = `djg6eojhrivnayhax7ohoszd`. Migrations rodam a cada início do app |
| Mídia | `/srv/sites/vibecoin/media` no servidor → `/data/media` no container (imagens das matérias, `AAAA/MM/`) |
| Variáveis | 12, cadastradas no app do Coolify (só `VITE_SITE_URL` no build). Cópia local do dono em `projetos\_segredos\vibecoin-vps.env` |
| Tarefas | Scheduled Tasks (UTC): `cotacoes` `7,22,37,52 * * * *`, `coletar` `15,45 * * * *`, `publicar` `25 * * * *`; `curl` com o `CRON_TOKEN` dentro do container |
| Backup | banco: todos os bancos, diário `30 6 * * *` UTC, 14 cópias locais |

## Rótulos do proxy (atenção)

Redirecionamentos 301 por **rótulos próprios** (gerenciamento automático desligado): `permanent=true` no
`to-non-www` e no `redirect-to-https`. O middleware `redirect-to-https` é **compartilhado por todos os apps** da VPS:
se um app o declarar diferente, todo http da VPS dá 503. Para trocar domínio: ligar "Readonly labels", salvar o
domínio, deixar o Coolify gerar os rótulos, aplicar de novo as duas linhas `permanent=true`, desligar o automático e
conferir `curl -sI http://criasite.app/x` → 301.

**Deploy sem certificado provisório (lição 14 de `criasite/docs/migracao-vps.md`, 2026-11-27):** num deploy, o container
antigo e o novo ficam no ar juntos por alguns minutos. Se um roteador com o **mesmo nome** tem configuração diferente nos
dois (regra, middlewares, TLS), o Traefik descarta o roteador e o site responde com o certificado provisório do Traefik
("não seguro") até o antigo sair (~4 min). Deploy comum (rótulos iguais) não tem esse problema (medido em 27/11: zero
segundos). Tirar um domínio só apaga roteadores e é seguro. Para **mudar** um roteador existente, dar a ele um nome novo
(ex.: `https-0-<uuid>` → `https-0b-<uuid>`, junto com o `service`), para os dois conviverem durante o deploy.

## Comandos úteis (SSH `root@189.24.17.85`, chave `~/.ssh/criasite_vps`)

- Logs do app: `docker logs --since 1h $(docker ps -qf name=tovkdkbzipk7pjzfaqb21ei3)`
- Robô à mão: `docker exec <container> sh -c 'curl -s -H "x-cron-token: $CRON_TOKEN" http://127.0.0.1:3000/api/cron/status'`
- SQL: `docker exec -it djg6eojhrivnayhax7ohoszd sh -c 'mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" vibecoin'`

## Site antigo na Hostinger

**Apagado em 2026-11-26** (18:04 UTC) com o ok do dono; não há mais volta. A exclusão apagou arquivos e banco antigos e o
registro `ftp` da zona, e mudou o TTL do `@` para 1800; `@` e `www` (A da VPS), MX, SPF, DKIM, DMARC e a verificação do
Google ficaram. A caixa `contato@vibecoin.com.br` (pedido "Free Business Email", separado, até 2027-11-14) continua ativa.

## Cuidados

- Variável nova ou alterada no Coolify só entra no container com **deploy** (o restart não basta).
- A `economia.awesomeapi.com.br` (dólar) já respondia 429 na Hostinger; o código usa o dólar derivado da CoinGecko.
