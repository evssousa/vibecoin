# Registro de decisões

Mais recente no topo. Cada decisão diz o que foi decidido, quando e por quê.

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
  Noite junta os três e mantém as matérias confortáveis de ler. Protótipo em `prototipo/`.
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
