# Registro de decisões

Mais recente no topo. Cada decisão diz o que foi decidido, quando e por quê.

## 2026-11-13 — Identidade própria, separada do Respawnou

- **O quê:** a marca virou uma "moeda" violeta (#7B5CFF) com o V branco (antes, quadrado verde-limão
  como o do Respawnou). Os rótulos de seção trocaram o "> " de terminal por `.eyebrow`: bolinha com halo
  na cor do texto + letras espaçadas. Busca do topo com lupa no lugar do ">". O README não cita o Respawnou.
- **Por quê:** pedido do dono — os dois sites estavam parecidos demais. O lima continua como cor de
  destaque (gráficos, chamadas), agora ao lado do violeta.

## 2026-11-13 — Robô: fontes internacionais + Agência Brasil, nada de concorrente brasileiro

- **O quê:** 8 veículos internacionais de cripto e a Agência Brasil (Economia). Ficaram de fora
  Livecoins, Portal do Bitcoin e similares.
- **Por quê:** reescrever um site brasileiro em português é quase cópia (risco para o AdSense e para a
  reputação). A Agência Brasil tem licença CC BY 4.0, que permite reaproveitar com crédito.
- Sites que bloqueiam a página da matéria (CoinDesk 429, The Block e Blockworks 403) entram só com o
  texto do RSS, como no Respawnou: nada de se passar por navegador.

## 2026-11-13 — Regra anti-recomendação na checagem do robô

- **O quê:** além das regras do Respawnou, a checagem reprova "hora de comprar", "vale a pena comprar",
  "lucro garantido", "vai disparar", "rumo à lua", "compre agora" e afins; o prompt proíbe previsão de
  preço (projeção só atribuída a quem fez). Na coleta, previsão de preço/análise técnica, patrocinado,
  pré-venda/airdrop e listas de "moedas para comprar" já são descartados.
- **Por quê:** site de finanças com conteúdo automático é YMYL para o Google; recomendação sem registro
  na CVM também seria problema. Ver /aviso-de-risco.
- Guias ficam fora do robô (escritos à mão no painel), porque pedem experiência que a IA não tem.

## 2026-11-12 — Cotações gravadas no banco por um job, nunca buscadas na hora da página

- **O quê:** `/api/cron/cotacoes` (Cron Job da Hostinger a cada 15 min) busca CoinGecko, alternative.me
  e AwesomeAPI e grava em `coins`, `coin_history` e `settings.market`. As páginas só leem o MySQL.
- **Por quê:** página rápida, sem depender de API de fora no momento da visita; dentro do limite de
  10 mil chamadas/mês da CoinGecko gratuita; se uma fonte cair, fica o último valor.
- Moeda sem cotação (`price_brl` NULL, antes da primeira coleta) não aparece; sem nenhuma, cotações,
  conversor e simulador somem do menu (mesma regra das páginas vazias).

## 2026-11-12 — Simulador começa com 12 meses e cresce sozinho

- **O quê:** histórico mensal pela CoinGecko gratuita (365 dias), guardado mês a mês em `coin_history`.
  "Valeria hoje" usa a cotação do momento, não o último fechamento.
- **Por quê:** o plano gratuito não dá histórico mais antigo (testado: erro 10012). Guardando cada
  fechamento, em um ano o simulador terá 24 meses, e assim por diante. Se um dia valer a pena, dá para
  completar o passado com outra fonte gratuita.

## 2026-11-12 — Dólar pela AwesomeAPI

- **O quê:** USD/BRL e a variação do dia vêm de `economia.awesomeapi.com.br` (grátis, sem chave,
  brasileira). A CoinGecko não dá a variação do dólar.

## 2026-11-12 — Auditoria de layout (fase 0)

Script com puppeteer-core + Edge sem janela em 21 páginas × 375/768/1024/1440: estouro de largura,
alvos de toque < 44 px, contraste (4,5:1; 3:1 em texto grande) e erros de console. Mais o clique em
todos os links do menu e do rodapé (navegação sem recarregar) e contas conferidas nas ferramentas.
Corrigido:

- **Página /cotacoes com 724 px no celular:** a `<caption>` `sr-only` da tabela é absoluta e escapava
  da caixa de rolagem. Toda caixa `overflow-x-auto` com tabela agora é `relative`.
- **Alvos de toque:** links da faixa de cotações e do menu com 44 px de altura; títulos das listas de
  matérias viraram bloco (a linha inteira é clicável); busca do topo com 46 px.

## 2026-11-12 — Newsletter fica fora até existir o serviço

- **O quê:** o protótipo tinha um bloco "Pega a vibe toda manhã" com campo de e-mail. No site ele não
  entra por enquanto; o rodapé escuro oferece o RSS no lugar.
- **Por quê:** formulário que não envia nada é placeholder, e o AdSense reprova site "em construção"
  (mesma regra do Respawnou, que tirou login e botões sem função). Volta quando houver serviço de e-mail.

## 2026-11-12 — Ferramentas aparecem só com dados

- **O quê:** cada ferramenta entra no menu, na home e no sitemap só se tiver o que precisa:
  conversor (cotações), simulador (histórico mensal de pelo menos 12 meses), comparador (corretoras
  cadastradas). A calculadora de IR é só conta e aparece sempre. Regra em `getAvailability()`.
- **Por quê:** mesma regra das páginas vazias do Respawnou.

## 2026-11-12 — Calculadora de IR: corretoras brasileiras, regra conferida com data

- **O quê:** isenção até R$ 35 mil vendidos no mês; acima, 15% a 22,5% sobre o lucro, por faixa;
  DARF 4600. Exterior fica fora (outra regra, anual). A data da conferência aparece na página
  (`RULES_CHECKED_AT` em `app/lib/tax.ts`).
- **Por quê:** a regra de cripto já teve propostas de mudança (alíquota única, fim da isenção). Mostrar
  a data deixa claro até quando a conta vale. **Conferir de novo antes de pôr no ar.**

## 2026-11-12 — "Aviso de risco" como página legal própria

- **O quê:** `/aviso-de-risco` no grupo legal, linkado no rodapé, em toda matéria e nas ferramentas.
- **Por quê:** site de finanças precisa deixar claro que não é recomendação de investimento (o site não
  é registrado na CVM) e o Google trata conteúdo financeiro como YMYL (exige mais transparência).

## 2026-11-12 — Layout "Dia e Noite"

- **O quê:** topo escuro (roxo-noite `#0f0b1a` + lima `#c6f432`: faixa de cotações, menu, destaque,
  card do BTC e "vibe do mercado"), corpo claro (`#faf9ff` + violeta `#5b2ee6`) para leitura, rodapé
  escuro. Fontes Plus Jakarta Sans + JetBrains Mono (números).
- **Por quê:** escolhido pelo dono entre 16 protótipos em 4 rodadas. Gostou das cores chamativas do
  Terminal/Terminal Neon, da seção de ferramentas do Clean Vibe e da beleza do Clean Noite; o Dia e
  Noite junta os três e mantém as matérias confortáveis de ler. Os 16 protótipos ficam no canvas de
  design do dono (fora do repositório: o arquivo do canvas só abre lá); o site é a referência agora.
- Alta e queda usam seta + sinal, não só cor (acessibilidade).

## 2026-11-12 — Fundação

- **Nome:** Vibecoin (vibecoin.com.br). Só pt-BR. Tema: finanças, principalmente criptomoedas.
- **Projeto irmão do Respawnou:** mesma stack (React 19 + React Router 8 SSR + Tailwind 4 +
  TypeScript), Hostinger (Node.js + MySQL + Cron Jobs), robô com Gemini no plano gratuito.
- **Repositório público** `evssousa/vibecoin` como portfólio, todos os direitos reservados (LICENSE
  própria, `"license": "UNLICENSED"`). Nunca commitar segredos ou `.env`.
- **Editorias:** Notícias, Bitcoin, Altcoins, Mercado, Grana (finanças pessoais), Regulação, Guias.
- **Dados de mercado:** CoinGecko (plano gratuito "Demo") para cotações e gráficos; índice de medo e
  ganância da alternative.me (grátis). Sem APIs pagas.
- **Domínio canônico:** apex `https://vibecoin.com.br`, www redireciona 301 (lição do animeprofile).
- **Dados de exemplo nunca em produção** (lição do Respawnou): com banco configurado, o site lê só o
  MySQL; sem matéria, a home mostra "aguardando a primeira matéria".

## 2026-11-14

- **Posts do caso Binance/DOJ duplicados ficam como estão.** O dono não vai arquivar nenhum: o filtro de assunto repetido impede casos novos.
- **Guias iniciais aprovados pelo dono** (migration 004), sem alterações.
- **Newsletter só depois do AdSense ativo.** Não construir antes.
- **Comparador de corretoras:** o dono não conhece as corretoras, então a escolha segue critérios objetivos (empresa brasileira com CNPJ, atuação regular no Brasil, Pix, histórico sem calote a clientes), sem indicar uma "melhor". Dados de taxas vêm dos sites oficiais com data de conferência.
- **Comparador publicado com 4 corretoras** (Binance, Bitso, Foxbit, Mercado Bitcoin), aprovado pelo dono, inclusive a Foxbit com o pedido de autorização no Banco Central ainda pendente (informação da própria página dela, não exibida na tabela). NovaDAX fora por falta de fonte oficial acessível. Coluna de moedas removida.
- **Filtro de repetição em duas barreiras (2026-11-15).** A primeira (título original da pauta contra pautas já usadas) não pegou o 3º post do caso Binance/DOJ; a segunda compara o título final em português com os posts recentes. Não arquivar os 3 posts existentes (decisão do dono).

## 2026-11-16

- **Fontes de Regulação/Mercado (migration 007):** entram Protos, Crypto Briefing, Cryptonews e CryptoPotato. Ficam de fora: CVM e Receita (feeds do gov.br sem notícias limpas e licença Creative Commons sem obras derivadas), Câmara e Senado (política geral), Finbold (ações e previsão de preço), U.Today e Coinspeaker (conteúdo patrocinado). Em português, só a Agência Brasil: reescrever concorrente nacional vira quase cópia.

## 2026-11-19

- **Cryptonews e CryptoPotato desativadas (migration 009).** Em 3 dias não renderam nenhuma matéria: só previsão de preço (descartada) e pauta expirada. Crypto Briefing apareceu como fonte em 5 de 16 matérias e abriu a editoria Regulação; Protos rendeu 1 reportagem. Ficam as duas.
- **Painel de visitas = módulo do animeprofile (plano `animeprofile/docs/plano-painel-visitas.md`).** Contagem própria sem cookie, no site inteiro, por `POST /api/v` (sobrevive ao cache da CDN). Agregado por dia, nunca uma linha por visita. Diferenças do vibecoin: o sal diário fica na tabela própria `visit_salt` (não em `settings`, que o painel Config. lê inteira); sem ícones de biblioteca (setas de texto e um SVG); sem tema escuro; a limpeza de retenção roda sozinha uma vez por dia dentro da gravação (sem cron novo). O contador antigo (`/api/view`) vira um 204 temporário. Textos de `/privacidade` e `/cookies` ajustados (contagem sem cookie, 13 meses).

## 2026-11-25

- **Textos de `/privacidade` e `/cookies` aprovados pelo dono** (contagem de visitas sem cookie, retenção de 13 meses).

## 2026-11-26

- **Site na VPS (Coolify):** o vibecoin saiu do Cloud Startup e roda na VPS KVM 1 junto com criasite e respawnou, pelo
  módulo `../criasite/docs/migracao-vps.md`. Banco no MariaDB compartilhado, imagens em `/srv/sites/vibecoin/media`,
  tarefas agendadas no Coolify com os mesmos horários dos Cron Jobs antigos. Sem AAAA (IPv6) por enquanto.
