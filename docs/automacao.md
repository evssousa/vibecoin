# Robô de postagem

Status: código pronto e testado localmente (coleta real das 9 fontes: 183 pautas, 0 erros).
A escrita depende da `GEMINI_API_KEY` no hPanel. Código: `app/lib/robot/` e `app/routes/cron.ts`.
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

## Fontes (migration 002)

| Fonte | Peso | Observação |
|---|---|---|
| Cointelegraph | 9 | página e imagens abrem |
| Decrypt | 8 | idem |
| CoinDesk | 8 | página responde 429 ao robô: usa o texto do RSS |
| Bitcoin Magazine | 7 | |
| The Block | 6 | página 403: usa o texto do RSS |
| CryptoSlate | 6 | |
| The Defiant | 6 | |
| Blockworks | 5 | página 403: usa o texto do RSS |
| Agência Brasil (Economia) | 6 | licença CC BY 4.0 (crédito "Imagem: Agência Brasil (CC BY 4.0)"); cobre Grana e Regulação |

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
   mesmo assunto + 8 se < 6 h − 12 por matéria que a fonte já rendeu em 24 h.
3. Junta até 2 fontes de outros veículos sobre o mesmo assunto; baixa a página (ou usa o RSS).
4. Escolhe a capa (≥ 1200 px, horizontal, nítida) **antes** do Gemini: sem capa, a pauta é descartada.
5. Gemini escreve em JSON (guia editorial em `writer.server.ts`): editoria, palavra-chave, título,
   meta description, linha fina, tags, moedas citadas e corpo em blocos.
6. Checagem (`quality.ts`): título 30–70, meta 110–160, palavra-chave no título e no lide, ≥ 350
   palavras, ≥ 2 h2 + "Mais sobre…", sem frase em inglês, sem parágrafo repetido, rumor tratado como
   rumor, **todo número precisa existir nas fontes**, e **nenhuma frase de recomendação ou promessa**
   ("hora de comprar", "lucro garantido", "vai disparar", "rumo à lua"...). Reprovou → volta para o
   Gemini com a lista de problemas (até 3 tentativas).
7. Montagem (`assemble.ts`): imagem abaixo de cada h2, vídeo do YouTube da fonte depois do lide,
   "Leia também" e pelo menos 1 link interno (1ª menção de moeda citada → `/cotacoes/<moeda>`).
8. Imagens baixadas, convertidas para WebP (até 1600 px) e servidas em `/media` (`MEDIA_DIR`).
9. O mesmo assunto em outros veículos é marcado como usado para não virar outro post.

## Configurações (painel → Config., tabela `settings`)

`robot_enabled`, `posts_per_day` (4), `robot_sections` (todas menos Guias), `robot_min_words` (350),
`robot_start_hour` (8), `robot_end_hour` (22).
