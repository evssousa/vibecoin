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
| Painel | publicadas hoje/7 dias/total, fila, últimas execuções, avisos (rascunhos, pautas reprovadas, fontes com erro) |
| Matérias | busca e filtros; criar matéria à mão (nasce rascunho); excluir rascunho/arquivada |
| Editor | título (contador), linha fina, palavra-chave, tags, meta description (contador), moedas citadas, nível (guias), capa com envio do computador, corpo em texto simples (`## intertítulo`, `- lista`, `1. lista numerada`, `> citação`, `[link](url)`, imagens com envio), publicar/tirar do ar/destacar (o destaque da home vale por 72 h após a publicação; depois sai sozinho e entra a notícia mais recente, nunca um guia)/arquivar/excluir, refazer com o robô, pré-visualizar (`?previa=1`) |
| Fila | pautas por situação (na fila, usadas, reprovadas, descartadas), descartar ou devolver para a fila |
| Fontes | ativar/desativar, peso, adicionar feed (testado antes de salvar) |
| Robô | rodar agora: coletar, publicar uma, testar sem gravar, atualizar cotações, diagnóstico do Gemini; histórico com o rascunho dos testes |
| Config. | robô ligado, matérias por dia, janela de horário, mínimo de palavras, editorias liberadas |

Guias são escritos à mão no painel (o robô não escreve guias).

## Contador de visitas

A página da matéria avisa `POST /api/view` depois de abrir no navegador. Não contam bots, a mesma
pessoa na mesma matéria em 30 min, nem o admin logado. Alimenta "Mais lidas" (últimos 7 dias).
