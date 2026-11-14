# Robô de postagem

Status: ✅ no ar. Coleta real das 9 fontes no servidor (183 pautas, 0 erros). `GEMINI_API_KEY` de conta
própria (contato@vibecoin.com.br) cadastrada em 2026-11-13; diagnóstico ok (gemini-3.5-flash e
3.5-flash-lite). Código: `app/lib/robot/` e `app/routes/cron.ts`.

Primeiro teste `dry=1` (2026-11-13): "Nvidia: renúncia de Jensen Huang faz bitcoin e mercado caírem",
609 palavras, capa 1920×1080, 3 imagens, links para as cotações de BTC e ETH, aprovada na 2ª tentativa.
Defeitos vistos e corrigidos na checagem: decimal com ponto ("46.4%") e citações sem autor.
Mesmo modelo do Respawnou, sem as partes de games (IGDB, consenso da crítica, ofertas, compilações).

## Arquitetura

```
Cron Jobs da Hostinger
   │  :07 :22 :37 :52   /api/cron/cotacoes   (cotações, ver cotacoes.md)
   │  :15 :45           /api/cron/coletar    lê os feeds → feed_items (status "new")
   │  :25 de hora em hora /api/cron/publicar escolhe 1 pauta → Gemini → checagem → posts
   ▼
MySQL local (127.0.0.1)
```

- Token em `CRON_TOKEN`; sem token correto → 404. Cada execução fica em `cron_runs` (painel → Robô).
- Respondem 202 na hora e rodam em segundo plano (a CDN corta em ~55 s); `wait=1` só para uso local.
- Trava: execução do mesmo job "rodando" há menos de 10 min impede outra; a que passou de 10 min é
  marcada como interrompida (deploy reiniciou o app).
- Gemini 503/travado: tenta de novo, cai para o próximo modelo; se falhar, a pauta volta para a fila e
  a coleta seguinte (até 30 min) já tenta publicar de novo. Cota grátis: ~20 pedidos/dia por modelo.
- Sem `GEMINI_API_KEY`, `publicar` registra "sem chave" e não faz nada.

## Fontes (migrations 002 e 003)

Situação medida em produção em 2026-11-14 com `/api/cron/paginas` (palavras do RSS / da página):

| Fonte | Peso | Observação |
|---|---|---|
| Cointelegraph | 9 | RSS ~20 palavras; página abre (~640 palavras depois da correção do leitor) |
| Decrypt | 8 | RSS ~30; página abre (~700 depois da correção do leitor) |
| CoinDesk | 8 | página responde 429 ao robô: só o resumo do RSS (~50) |
| Bitcoin Magazine | 7 | texto completo no RSS |
| The Block | 6 | página 403: só o resumo do RSS (~15) |
| CryptoSlate | 6 | página abre (~540) |
| The Defiant | 6 | RSS ~30; página monta o texto fora de `<p>` (~60): fraca |
| Blockworks | 5 | página 403: só o resumo do RSS |
| Agência Brasil (Economia) | 6 | texto completo no RSS; licença CC BY 4.0 (crédito "Imagem: Agência Brasil (CC BY 4.0)"); cobre Grana e Regulação |
| BeInCrypto (003) | 7 | texto completo no RSS (~440) |
| CoinJournal (003) | 6 | texto completo no RSS (~650) |
| Bitcoinist (003) | 5 | texto completo no RSS (~790) |

Leitor de página (`extractArticleText`): usa o `<article>` que rende mais texto (Cointelegraph e Decrypt têm
`<article>` nos cards de "leia também" antes da matéria; o leitor antigo pegava o primeiro e lia 4–12
palavras). Se nenhum `<article>` chega a 150 palavras, lê a página inteira (traz menu e cookies, por isso
só como último recurso).

Fora de propósito: sites brasileiros de cripto (Livecoins, Portal do Bitcoin...). Reescrever concorrente
em português é quase cópia. O robô nunca se disfarça de navegador para contornar bloqueio.

## Coleta (`/api/cron/coletar`)

- Itens das últimas 48 h; pontuação = peso × 10 + tipo de notícia (aprovação, lançamento, processo,
  ataque/hack, regulação, ETF/empresas grandes, Brasil).
- Descartes automáticos: previsão de preço/análise técnica, conteúdo patrocinado/press release,
  pré-venda/airdrop/"moedas para comprar", podcast/quiz/sorteio, opinião, resumos tipo newsletter.
- Itens com mais de 48 h que não viraram matéria expiram.

## Publicação (`/api/cron/publicar`)

1. Respeita `robot_enabled`, a janela 8h–22h de Brasília, `posts_per_day` e o intervalo mínimo
   (janela ÷ posts por dia). `force=1` ignora horário/limite; `dry=1` gera sem gravar.
2. Ordem da fila (`rankedQueue`, regra do Respawnou): tipo de notícia + peso ×3 + 10 por outro veículo no
   mesmo assunto + 8 se < 6 h − 12 por matéria que a fonte já rendeu em 24 h + 25 se a pauta (ou outra do
   mesmo assunto) tem ≥ 150 palavras no RSS − 30 se a fonte está "travada" (≥ 3 descartes por pouco
   conteúdo e nenhuma matéria em 3 dias) e a pauta não tem texto. Tenta até 8 pautas por execução, com
   no máximo 2 chamadas ao Gemini (pautas sem texto são descartadas antes, sem gastar cota).
2b. **Assunto repetido**: antes de escrever, descarta pauta cujo título (na língua da fonte) divide ≥ 3 palavras e ≥ 60% com o de uma pauta já usada nos últimos ~4 dias (`coveredTopics`/`isCovered`), motivo "assunto já publicado nos últimos dias". Antes disso só se comparava com a própria fila, e o caso Binance/DOJ saiu duas vezes (2026-11-12 e 2026-11-14).
3. Junta até 2 fontes de outros veículos sobre o mesmo assunto; baixa a página (ou usa o RSS).
4. Escolhe a capa (≥ 1200 px, horizontal, nítida) **antes** do Gemini: sem capa, a pauta é descartada.
5. Gemini escreve em JSON (guia editorial em `writer.server.ts`): editoria, palavra-chave, título,
   meta description, linha fina, tags, moedas citadas e corpo em blocos.
6. Checagem (`quality.ts`): título 30–70, meta 110–160, palavra-chave no título e no lide, ≥ 350
   palavras, ≥ 2 h2 + "Mais sobre…", sem frase em inglês, sem parágrafo repetido, rumor tratado como
   rumor, **todo número precisa existir nas fontes**, **nenhuma frase de recomendação ou promessa**
   ("hora de comprar", "lucro garantido", "vai disparar", "rumo à lua"...) e **toda citação em destaque
   diz quem falou** (no parágrafo anterior). Reprovou → volta para o Gemini com a lista de problemas
   (até 3 tentativas). Correção automática, sem gastar Gemini: decimal com ponto antes de "%" vira
   vírgula ("46.4%" → "46,4%").
7. Montagem (`assemble.ts`): imagem abaixo de cada h2, vídeo do YouTube da fonte depois do lide,
   "Leia também" e pelo menos 1 link interno (1ª menção de moeda citada → `/cotacoes/<moeda>`).
8. Imagens baixadas, convertidas para WebP (até 1600 px) e servidas em `/media` (`MEDIA_DIR`).
9. O mesmo assunto em outros veículos é marcado como usado para não virar outro post.

## Configurações (painel → Config., tabela `settings`)

`robot_enabled`, `posts_per_day` (4), `robot_sections` (todas menos Guias), `robot_min_words` (350),
`robot_start_hour` (8), `robot_end_hour` (22).
