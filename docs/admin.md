# Painel administrativo (/admin)

Mesmo painel do Respawnou, com o visual do Vibecoin. Só o dono acessa: fora dos menus, `noindex`,
`Disallow` no robots.txt, cabeçalho `X-Robots-Tag` e cache desligado.

## Acesso

Três variáveis no hPanel (Sites → vibecoin.com.br → Node.js → Variáveis de ambiente):

| Variável | O que é |
|---|---|
| `ADMIN_EMAIL` | e-mail de login |
| `ADMIN_PASSWORD_HASH` | hash scrypt da senha, gerado por `npm run admin:hash` no computador (a senha nunca é guardada) |
| `SESSION_SECRET` | segredo do cookie de sessão (o mesmo comando gera um) |

- Sessão em cookie assinado (`__vibecoin_admin`, 7 dias, httpOnly, SameSite=Lax).
- 5 tentativas erradas por IP em 15 min bloqueiam o login.
- Sem as variáveis, a tela de login diz o que falta (só nomes, nunca valores).

## Telas

| Tela | O que faz |
|---|---|
| Visitas | páginas vistas hoje/ontem/7/30 dias/total, gráfico de 30 dias, páginas mais vistas (com filtro de tipo), de onde vêm (busca, redes, sites, campanhas UTM), aparelho, navegador e sistema |
| Painel | publicadas hoje/7 dias/total, fila, últimas execuções, avisos (rascunhos, pautas reprovadas, fontes com erro) |
| Matérias | busca e filtros; criar matéria à mão (nasce rascunho); excluir rascunho/arquivada |
| Editor | título (contador), linha fina, palavra-chave, tags, meta description (contador), moedas citadas, nível (guias), capa com envio do computador, corpo em texto simples (`## intertítulo`, `- lista`, `1. lista numerada`, `> citação`, `[link](url)`, imagens com envio), publicar/tirar do ar/destacar (o destaque da home vale por 72 h após a publicação; depois sai sozinho e entra a notícia mais recente, nunca um guia)/arquivar/excluir, refazer com o robô, pré-visualizar (`?previa=1`) |
| Fila | pautas por situação (na fila, usadas, reprovadas, descartadas), descartar ou devolver para a fila |
| Fontes | ativar/desativar, peso, adicionar feed (testado antes de salvar) |
| Robô | rodar agora: coletar, publicar uma, testar sem gravar, atualizar cotações, diagnóstico do Gemini; histórico com o rascunho dos testes |
| Config. | robô ligado, matérias por dia, janela de horário, mínimo de palavras, editorias liberadas |

Guias são escritos à mão no painel (o robô não escreve guias).

## Contador de visitas

Módulo `app/visitas` (o mesmo do animeprofile; instruções para copiar em `app/visitas/README.md`).

- **Coleta:** o navegador avisa `POST /api/v` depois que cada página abre (componente `VisitBeacon` no `App`), no site inteiro. Isso funciona mesmo com o HTML vindo do cache da CDN. Sem cookie, sem `localStorage` e sem guardar IP: o servidor calcula um código de visitante (hash do IP + navegador + um sal que muda e é apagado todo dia, de Brasília) só para não contar a mesma pessoa duas vezes no dia.
- **Não contam:** robôs (`isbot`), pré-carregamento de link, o admin logado, `/admin` e `/api`, recarregar a mesma página em menos de 30 s.
- **Gravação:** os números ficam na memória e vão para o banco a cada 10 s, somados por dia (`visit_daily`, `visit_pages`, `visit_dims`). Um reinício do app perde no máximo 10 s.
- **`posts.views`** (alimenta "Mais lidas", 7 dias) soma pela mesma coleta: 1 por pessoa a cada 30 min na mesma matéria. O número continua do que já estava (as visitas antigas não se perdem). O endereço antigo `/api/view` responde 204 sem fazer nada, só para o HTML em cache da CDN; pode ser apagado depois de uma semana.
- **Retenção:** códigos de visitante, só do dia; páginas e origens, 400 dias; totais por dia, sem prazo. A limpeza roda sozinha uma vez por dia (dentro da gravação), sem cron.
- **Visitantes** são por dia; para 7 e 30 dias o painel mostra a média por dia (somar repetiria quem volta).
- **Ajustes do site:** `app/visitas/config.ts` (tipos de página, filtros, títulos fixos, contador por matéria, cookie do admin), `db.ts`, `site.server.ts` (títulos) e `ui/visitas.css` (cores). Atenção: esse número é menor que o de ferramentas que contam toda troca de página.
