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
| [banco-de-dados.md](banco-de-dados.md) | Tabelas, migrations, formato dos JSON e testes feitos |
| [cotacoes.md](cotacoes.md) | Fontes de dados de mercado, jobs do cron, limites da CoinGecko, moedas acompanhadas |
| [deploy-hostinger.md](deploy-hostinger.md) | Site, build, banco, variáveis, Cron Job, SSL e cuidados na Hostinger |
| [automacao.md](automacao.md) | Robô de postagem: fontes, coleta, publicação, checagem de qualidade |
| [admin.md](admin.md) | Painel /admin: acesso, telas, contador de visitas |

Próximo documento (quando a fase começar): `adsense.md`.

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
| 0 | Auditoria de UX/UI em 375 / 768 / 1024 / 1440 (estouro, toque, contraste) + clique em todos os links do menu e rodapé + teste das ferramentas | ✅ |
| 1 | Schema MySQL + migration 001 (matérias, moedas, histórico, corretoras, robô, cron, configurações) | ✅ |
| 1 | Camada MySQL com a mesma interface do mock (`repo/mysql.server.ts`), testada contra o mock | ✅ |
| 1 | Coleta de cotações (`/api/cron/cotacoes`): CoinGecko + medo e ganância + dólar, histórico mensal; testada com dados reais | ✅ |
| 2 | Site Node.js na Hostinger + auto-deploy pelo GitHub + SSL + www→apex (no ar em 2026-11-13) | ✅ |
| 2 | Banco MySQL na Hostinger (migration 001 aplicada), variáveis `DB_*` e `CRON_TOKEN`, Cron Job de 15 min, primeira coleta de cotações | ✅ |
| 2 | Chave Demo gratuita da CoinGecko cadastrada no hPanel (`COINGECKO_API_KEY`) pelo dono; testada (sem 429) | ✅ |
| 2 | E-mail contato@vibecoin.com.br (criado pelo dono no hPanel, 2026-11-13) | ✅ |
| 2 | Histórico mensal completo das 18 moedas (12 meses cada) | ✅ |
| 3 | Robô de postagem: 9 fontes, filtros de cripto, Gemini, checagem com regra anti-recomendação (migration 002) — ver automacao.md | ✅ |
| 3 | Painel /admin: matérias (editor, prévia, envio de imagens), fila, fontes, robô, configurações — ver admin.md | ✅ |
| 3 | Contador de visitas e "Mais lidas" reais | ✅ |
| 3 | Marca própria: moeda violeta no lugar do quadrado lima; rótulos com bolinha no lugar do ">" (diferente do Respawnou) | ✅ |
| 3 | Cron Jobs de coletar (:15 e :45) e publicar (:25) | ✅ |
| 3 | `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` e `SESSION_SECRET` no hPanel (login do painel funcionando, 2026-11-13) | ✅ |
| 3 | `GEMINI_API_KEY` de conta própria do Google (contato@vibecoin.com.br) cadastrada; diagnóstico ok | ✅ |
| 3 | Teste `dry=1` em produção aprovado (ver automacao.md); checagem ganhou decimal com vírgula e citação com autor | ✅ |
| 3 | Primeira matéria automática no ar (o robô publica das 8h às 22h de Brasília) | ✅ |
| 3 | Robô publicava pouco (1 matéria em 2026-11-13: resumos de RSS curtos). Correção em 2026-11-14: fila prioriza pauta com texto, 3 fontes com texto completo no RSS (migration 003), leitor de página corrigido para Cointelegraph e Decrypt, diagnóstico `/api/cron/paginas` | ✅ |
| 3 | 4 guias "Aprenda do zero" no ar (migration 004): bitcoin, primeira compra, carteiras, stablecoins. Dono revisa o texto no painel | ✅ |
| 3 | Robô não repete assunto já publicado (filtro rígido por títulos das pautas usadas nos últimos dias; antes saiu o caso Binance/DOJ duas vezes) | ✅ |
| 3 | Observação de 24 h do robô (2026-11-14 a 15): 6 posts, ritmo ok; achado: 3º post do caso Binance/DOJ passou pelo filtro; corrigido com 2ª barreira (título final em português) | ✅ |
| 3 | Guia "DeFi sem susto" (nível avançado, migration 006) no ar; agora são 5 guias | ✅ |
| 3 | Barreira contra matéria repetida conferida em 2026-11-16 (5 posts em ~18 h, nenhum repetido; a barreira de título final não precisou agir; a de pauta barrou 3 itens em 7 dias). Gemini deu 503 por ~1 h em 16/11 nos 3 modelos; o robô tenta de novo sozinho | ✅ |
| 3 | Fontes novas para Regulação/Mercado: Protos, Crypto Briefing, Cryptonews, CryptoPotato (migration 007); CVM, Receita, Câmara, Senado e outras testadas e descartadas (ver decisoes.md) | ✅ |
| 3 | Destaque da home corrigido (2026-11-17): a marcação manual vale 72 h e guia nunca é destaque automático (antes `featured DESC` prendia o guia "O que é bitcoin" por dias); siglas em maiúsculas nos textos do robô (migration 008) | ✅ |
| 3 | Comparador de corretoras com dados reais dos sites oficiais (Binance, Bitso, Foxbit, Mercado Bitcoin; migration 005, 2026-11-14) | ✅ |
| 4 | Newsletter "Resumo diário": só depois que o AdSense estiver ativo (decisão do dono, 2026-11-14) | 💤 |
| 4 | Google Search Console: propriedade de Domínio na conta contato@, TXT de verificação no DNS da Hostinger (2026-11-13) | ✅ |
| 4 | Search Console verificado, sitemap enviado e inspeção de URL sem erros (dono, 2026-11-13) | ✅ |
| 4 | Pedido do AdSense | 💤 |
| — | Regra de IR da calculadora conferida em 2026-11-13 (MP 1.303 caducou; isenção de R$ 35 mil vale) + texto sobre os 17,5% e a DeCripto | ✅ |

## Próximos passos

2. Reconferir as taxas do comparador daqui a 1–2 meses; tentar incluir a NovaDAX quando a página oficial de taxas abrir.
3. Conferir em 2–3 dias o que as 4 fontes novas (migration 007) renderam: posts por fonte e descartes (`/api/cron/fontes`); tirar a que só gerar descarte.
4. Mais guias (IR sobre cripto passo a passo; depois, o que for pedido pela busca).
5. Pedido do AdSense quando houver mais matérias; a newsletter vem depois dele.
6. **Mídia kit** dentro de "Anuncie" (`app/routes/advertise.tsx`): público e números reais, formatos e pacotes, regras de
   conteúdo patrocinado (atenção às regras de publicidade de cripto/finanças), versão para baixar/imprimir e contato.
   Outra fonte de renda, vale para todos os sites. Falta planejar (`planejador`, tem parte visual); o piloto é o criasite.

## Pendências suas

_(nenhuma no momento)_
