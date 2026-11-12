# Documentação e plano do Vibecoin

Esta pasta (`docs/`) é a memória do projeto. Tudo o que for decidido ou construído entra aqui,
para que qualquer pessoa (ou o Claude, depois de perder o contexto) saiba onde estamos
e o que vem a seguir.

**Regra:** toda tarefa concluída atualiza o status abaixo e o documento da área.

O Vibecoin é o site irmão do [Respawnou](https://github.com/evssousa/respawnou): mesma stack,
mesma hospedagem e o mesmo modelo de robô de postagem. Quando houver dúvida de "como fazer",
a resposta quase sempre já está nos docs do Respawnou.

## Documentos

| Arquivo | Conteúdo |
|---|---|
| [decisoes.md](decisoes.md) | Registro de decisões (o quê, quando e por quê) |
| [arquitetura.md](arquitetura.md) | Stack, pastas, camada de dados, tema, variáveis de ambiente |
| [ferramentas.md](ferramentas.md) | Conversor, calculadora de IR, simulador e comparador: regras e fontes de dados |
| [prototipo/dia-e-noite.html](prototipo/dia-e-noite.html) | Protótipo escolhido do layout (16º de 16) |

Próximos documentos (criados quando a fase começar): `banco-de-dados.md`, `cotacoes.md`
(CoinGecko + alternative.me), `automacao.md` (robô), `admin.md`, `adsense.md`, `deploy-hostinger.md`.

## Status

Legenda: ✅ feito · 🔄 em andamento · ⏳ próximo · 💤 depois · ❓ esperando decisão do dono

| Fase | Item | Status |
|---|---|---|
| 0 | Nome, domínio (vibecoin.com.br), stack e repositório público de portfólio | ✅ |
| 0 | Layout "Dia e Noite" (escolhido entre 16 protótipos) | ✅ |
| 0 | Editorias: Notícias, Bitcoin, Altcoins, Mercado, Grana, Regulação, Guias | ✅ |
| 0 | Frontend completo com dados de exemplo: home, editorias, matéria, cotações, página da moeda, busca | ✅ |
| 0 | Ferramentas funcionando: conversor, calculadora de IR, simulador de aporte, comparador de corretoras | ✅ |
| 0 | Páginas institucionais e legais (11), incluindo o aviso de risco | ✅ |
| 0 | SEO base: title/description/canonical/OG, JSON-LD, sitemap, RSS, robots, imagem OG padrão | ✅ |
| 0 | AdSense preparado (desligado até existir `ADSENSE_CLIENT`), banner de cookies, `ads.txt` | ✅ |
| 0 | README de apresentação + LICENSE (todos os direitos reservados) | ✅ |
| 0 | Auditoria de UX/UI em 375 / 768 / 1024 / 1440 (estouro, toque, contraste) | ⏳ |
| 1 | Schema MySQL + migration 001 (posts, moedas, cotações, histórico, corretoras) | ⏳ |
| 1 | Camada MySQL com a mesma interface do mock (`repo/mysql.server.ts`) | ⏳ |
| 1 | Coleta de cotações: CoinGecko (preço, 7 dias, histórico mensal) + medo e ganância (alternative.me) | 💤 |
| 2 | Site Node.js na Hostinger + auto-deploy pelo GitHub + SSL + www→apex | 💤 |
| 2 | Banco MySQL na Hostinger e e-mail contato@vibecoin.com.br | 💤 |
| 3 | Robô de postagem (RSS + Gemini gratuito), no modelo do Respawnou | 💤 |
| 3 | Painel admin em /admin | 💤 |
| 3 | Comparador de corretoras com dados reais conferidos à mão | 💤 |
| 4 | Newsletter "Resumo diário" (precisa de serviço de e-mail; fica fora até existir) | ❓ |
| 4 | Google Search Console + sitemap, pedido do AdSense | 💤 |
| — | Conferir a regra de IR de cripto antes de pôr a calculadora no ar (ver ferramentas.md) | ⏳ |
