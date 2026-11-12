// Dados de exemplo (fictícios) para desenvolver o site sem banco.
// Nunca aparecem em produção: com DB_NAME/DB_USER definidos, o site lê só o MySQL.
// Preços, notícias e corretoras daqui NÃO são reais.
import type { Block, Broker, Coin, MarketOverview, MonthlyPrice, Post } from "./types";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

/** Série de 7 dias a partir de uma tendência (determinística, sem Math.random). */
function spark(last: number, change7d: number, wobble: number): number[] {
  const first = last / (1 + change7d / 100);
  return Array.from({ length: 28 }, (_, i) => {
    const t = i / 27;
    const wave = Math.sin(i * 0.9) * wobble * 0.5 + Math.sin(i * 0.35) * wobble;
    return Number((first + (last - first) * t + first * wave).toFixed(6));
  });
}

const coin = (
  rank: number,
  slug: string,
  symbol: string,
  name: string,
  priceBrl: number,
  change24h: number,
  change7d: number,
  marketCapBrl: number,
  description: string,
  stable = false,
): Coin => ({
  rank,
  slug,
  symbol,
  name,
  priceBrl,
  priceUsd: Number((priceBrl / 5.42).toFixed(priceBrl < 10 ? 4 : 2)),
  change24h,
  change7d,
  marketCapBrl,
  volume24hBrl: Math.round(marketCapBrl * 0.045),
  spark7d: stable ? Array.from({ length: 28 }, (_, i) => 5.42 + Math.sin(i) * 0.004) : spark(priceBrl, change7d, 0.01),
  description,
  stable,
  updatedAt: hoursAgo(0.05),
});

export const MOCK_COINS: Coin[] = [
  coin(1, "bitcoin", "BTC", "Bitcoin", 528_300, 2.4, 6.1, 10.4e12, "A primeira e maior criptomoeda, criada em 2009. Oferta limitada a 21 milhões de unidades."),
  coin(2, "ethereum", "ETH", "Ethereum", 19_040, 1.1, 3.0, 2.3e12, "Rede de contratos inteligentes onde roda a maior parte do DeFi, NFTs e stablecoins."),
  coin(3, "tether", "USDT", "Tether", 5.42, 0, 0, 780e9, "Stablecoin atrelada ao dólar americano, a mais negociada do mercado.", true),
  coin(4, "solana", "SOL", "Solana", 1_164, 5.7, 12.4, 550e9, "Blockchain rápida e de taxas baixas, popular em memecoins e aplicativos de consumo."),
  coin(5, "bnb", "BNB", "BNB", 3_481, 0.4, -1.2, 505e9, "Moeda da rede BNB Chain, usada para pagar taxas e em serviços do ecossistema."),
  coin(6, "xrp", "XRP", "XRP", 12.52, -1.8, -4.5, 715e9, "Moeda da rede XRP Ledger, criada para pagamentos e remessas internacionais."),
  coin(7, "usdc", "USDC", "USD Coin", 5.42, 0, 0, 230e9, "Stablecoin atrelada ao dólar, com reservas auditadas.", true),
  coin(8, "cardano", "ADA", "Cardano", 5.37, 0.9, 2.2, 190e9, "Blockchain desenvolvida com base em pesquisa acadêmica revisada por pares."),
  coin(9, "dogecoin", "DOGE", "Dogecoin", 2.07, -3.2, -7.9, 305e9, "A memecoin original, criada em 2013 como brincadeira e que virou uma das maiores do mercado."),
  coin(10, "chainlink", "LINK", "Chainlink", 98.4, -0.6, 1.4, 62e9, "Rede de oráculos que leva dados do mundo real (preços, clima, resultados) para contratos inteligentes."),
];

export const MOCK_MARKET: MarketOverview = {
  totalMarketCapBrl: 18.2e12,
  change24h: 1.9,
  btcDominance: 57.1,
  usdBrl: 5.42,
  usdBrlChange24h: -0.3,
  fearGreed: { value: 64, yesterday: 58, label: "Ganância" },
  updatedAt: hoursAgo(0.05),
};

/** Fechamentos mensais fictícios desde jan/2020 (simulador de aporte). */
function history(start: number, end: number, months: number, swing: number): MonthlyPrice[] {
  const out: MonthlyPrice[] = [];
  for (let i = 0; i < months; i++) {
    const y = 2020 + Math.floor(i / 12);
    const m = (i % 12) + 1;
    const t = i / (months - 1);
    const trend = start * Math.pow(end / start, t);
    // Ondas que zeram no último mês, para a série terminar no preço atual sem salto.
    const k = i - (months - 1);
    const cycle = 1 + Math.sin(k / 7.5) * swing + Math.sin(k / 2.3) * swing * 0.25;
    out.push({ month: `${y}-${String(m).padStart(2, "0")}`, priceBrl: Number((trend * cycle).toFixed(2)) });
  }
  return out;
}

const MONTHS = 82; // jan/2020 a out/2026
export const MOCK_HISTORY: Record<string, MonthlyPrice[]> = {
  bitcoin: history(38_000, 528_300, MONTHS, 0.35),
  ethereum: history(700, 19_040, MONTHS, 0.4),
  solana: history(4, 1_164, MONTHS, 0.55),
  cardano: history(0.2, 5.37, MONTHS, 0.5),
};

export const MOCK_BROKERS: Broker[] = [
  {
    slug: "exemplo-a",
    name: "Corretora Exemplo A",
    url: "https://example.com",
    makerFee: 0.3,
    takerFee: 0.5,
    pixDeposit: "Grátis",
    pixWithdraw: "R$ 3,90",
    coins: 120,
    features: ["Staking", "App", "Recompra automática"],
    checkedAt: "2026-11-01",
  },
  {
    slug: "exemplo-b",
    name: "Corretora Exemplo B",
    url: "https://example.com",
    makerFee: 0.2,
    takerFee: 0.35,
    pixDeposit: "Grátis",
    pixWithdraw: "Grátis",
    coins: 300,
    features: ["Staking", "App", "Futuros"],
    checkedAt: "2026-11-01",
  },
  {
    slug: "exemplo-c",
    name: "Corretora Exemplo C",
    url: "https://example.com",
    makerFee: 0.5,
    takerFee: 0.7,
    pixDeposit: "Grátis",
    pixWithdraw: "Grátis",
    coins: 40,
    features: ["App", "Atendimento em português"],
    checkedAt: "2026-11-01",
  },
];

const p = (text: string): Block => ({ type: "p", text });
const h2 = (text: string): Block => ({ type: "h2", text });
const ul = (...items: string[]): Block => ({ type: "ul", items });

/** Corpo padrão dos exemplos (para a página de matéria ter conteúdo). */
const body = (topic: string, extra: Block[] = []): Block[] => [
  p(`Este é um texto de exemplo sobre ${topic}. Ele existe só para mostrar como a matéria aparece no site enquanto o robô de postagem não está ligado.`),
  p(
    "As matérias reais vão citar as fontes com link, explicar o contexto para quem está chegando agora e evitar previsões de preço. Veja também a [cotação do bitcoin](/cotacoes/bitcoin) e o [conversor](/ferramentas/conversor).",
  ),
  h2("O que isso significa para você"),
  p("Aqui entra a parte prática: o que muda para quem investe, quem está pensando em começar e quem só quer entender a notícia."),
  ul("Ponto importante número um, em uma frase.", "Ponto importante número dois, com um [link interno](/guias).", "Ponto importante número três."),
  ...extra,
  h2("Próximos passos"),
  p("Nada aqui é recomendação de investimento. Leia o nosso [aviso de risco](/aviso-de-risco) antes de tomar qualquer decisão."),
];

interface Seed {
  slug: string;
  title: string;
  excerpt: string;
  section: Post["section"];
  tag?: string;
  coins?: string[];
  level?: Post["level"];
  h: number;
  read?: number;
  views?: number;
  featured?: boolean;
}

const SEEDS: Seed[] = [
  {
    slug: "bitcoin-na-beira-do-recorde-o-que-esta-empurrando-o-preco",
    title: "Bitcoin na beira do recorde: o que está empurrando o preço",
    excerpt: "ETFs comprando forte, menos moeda nas corretoras e apetite por risco. Os níveis que importam, sem enrolação.",
    section: "bitcoin",
    tag: "Análise",
    coins: ["bitcoin"],
    h: 0.2,
    read: 4,
    views: 5400,
    featured: true,
  },
  {
    slug: "proxima-atualizacao-do-ethereum-sem-jargao",
    title: "A próxima atualização do Ethereum, sem jargão",
    excerpt: "Taxas menores e carteiras mais simples: o que muda para quem usa a rede no dia a dia.",
    section: "altcoins",
    tag: "Explicado",
    coins: ["ethereum"],
    h: 0.6,
    views: 2100,
  },
  {
    slug: "banco-central-aperta-regras-para-corretoras-de-cripto",
    title: "Banco Central aperta as regras para corretoras de cripto",
    excerpt: "Capital mínimo, separação do dinheiro dos clientes e prazos de adaptação: o que muda e para quem.",
    section: "regulacao",
    h: 2,
    views: 3100,
  },
  {
    slug: "solana-bate-recorde-de-transacoes-com-febre-das-memecoins",
    title: "Solana bate recorde de transações com a febre das memecoins",
    excerpt: "A rede processou mais operações em um dia do que em qualquer outro momento. Entenda o que puxou o movimento.",
    section: "altcoins",
    coins: ["solana"],
    h: 3,
    views: 1800,
  },
  {
    slug: "selic-mantida-o-que-os-juros-altos-significam-para-o-bitcoin",
    title: "Selic mantida: o que os juros altos significam para o bitcoin",
    excerpt: "Renda fixa pagando bem compete com ativos de risco. A relação entre juros e cripto, explicada.",
    section: "mercado",
    coins: ["bitcoin"],
    h: 4,
    views: 1500,
  },
  {
    slug: "drex-entra-em-nova-fase-de-testes",
    title: "Drex entra em nova fase de testes com cooperativas",
    excerpt: "O projeto de real digital do Banco Central ganha novos participantes. O que já dá para saber.",
    section: "regulacao",
    h: 5,
    views: 900,
  },
  {
    slug: "protocolo-defi-sofre-ataque-e-congela-saques",
    title: "Protocolo DeFi sofre ataque e congela saques",
    excerpt: "Uma falha em um contrato inteligente permitiu a retirada de fundos. O que aconteceu e como se proteger.",
    section: "noticias",
    tag: "Segurança",
    coins: ["ethereum"],
    h: 6,
    views: 2600,
  },
  {
    slug: "gestoras-ampliam-oferta-de-etfs-de-cripto-na-b3",
    title: "Gestoras ampliam a oferta de ETFs de cripto na B3",
    excerpt: "Novos fundos de índice dão acesso a cripto pela conta da corretora tradicional. Taxas e diferenças.",
    section: "noticias",
    coins: ["bitcoin", "ethereum"],
    h: 8,
    views: 1200,
  },
  {
    slug: "dogecoin-recua-apos-rali-de-fim-de-semana",
    title: "Dogecoin recua depois do rali de fim de semana",
    excerpt: "Grandes carteiras movimentaram moedas para corretoras. O padrão que costuma aparecer depois de altas rápidas.",
    section: "altcoins",
    coins: ["dogecoin"],
    h: 10,
    views: 800,
  },
  {
    slug: "dolar-cai-e-bitcoin-em-reais-sobe-menos",
    title: "Dólar cai e bitcoin em reais sobe menos que em dólar",
    excerpt: "Por que a cotação em reais pode andar diferente da cotação lá fora — e como isso afeta o seu bolso.",
    section: "mercado",
    tag: "Explicado",
    coins: ["bitcoin"],
    h: 14,
    views: 700,
  },
  {
    slug: "reserva-de-emergencia-antes-da-cripto",
    title: "Reserva de emergência antes da cripto: por quê e quanto ter",
    excerpt: "A regra mais ignorada por quem começa a investir — e a que mais evita prejuízo.",
    section: "grana",
    h: 18,
    views: 1900,
  },
  {
    slug: "selic-alta-o-que-rende-mais-que-a-poupanca",
    title: "Selic alta: o que rende mais que a poupança hoje",
    excerpt: "Tesouro Selic, CDB e fundos DI comparados, com a conta já feita.",
    section: "grana",
    h: 26,
    views: 1300,
  },
  {
    slug: "cripto-no-imposto-de-renda-passo-a-passo",
    title: "Cripto no Imposto de Renda: o passo a passo para declarar",
    excerpt: "Onde informar cada moeda, o limite de isenção e o que fazer com corretora estrangeira.",
    section: "grana",
    tag: "Impostos",
    coins: ["bitcoin"],
    h: 30,
    views: 4200,
  },
  {
    slug: "o-que-e-bitcoin-de-verdade",
    title: "O que é bitcoin, de verdade",
    excerpt: "Dinheiro digital, sem banco no meio e com oferta limitada. A explicação que faltava, em 5 minutos.",
    section: "guias",
    level: 1,
    coins: ["bitcoin"],
    h: 40,
    read: 5,
    views: 3300,
  },
  {
    slug: "como-comprar-sua-primeira-cripto-com-seguranca",
    title: "Como comprar sua primeira cripto com segurança",
    excerpt: "Escolher a corretora, ativar a verificação em duas etapas, fazer o Pix e comprar: passo a passo.",
    section: "guias",
    level: 1,
    coins: ["bitcoin"],
    h: 52,
    read: 8,
    views: 2800,
  },
  {
    slug: "carteira-fria-quente-e-autocustodia",
    title: "Carteiras: fria, quente e autocustódia",
    excerpt: "Onde guardar suas moedas, as diferenças entre cada tipo e quando vale tirar da corretora.",
    section: "guias",
    level: 2,
    h: 70,
    read: 7,
    views: 1600,
  },
  {
    slug: "defi-sem-susto-rendimentos-e-riscos",
    title: "DeFi sem susto: rendimentos e riscos",
    excerpt: "Empréstimos, pools e staking: de onde vem o rendimento e o que pode dar errado.",
    section: "guias",
    level: 3,
    coins: ["ethereum"],
    h: 90,
    read: 10,
    views: 1100,
  },
  {
    slug: "stablecoins-o-que-sao-e-para-que-servem",
    title: "Stablecoins: o que são e para que servem",
    excerpt: "Moedas digitais atreladas ao dólar: como mantêm o preço e quais os riscos.",
    section: "guias",
    level: 1,
    coins: ["tether", "usdc"],
    h: 110,
    read: 5,
    views: 900,
  },
  {
    slug: "halving-do-bitcoin-explicado",
    title: "Halving do bitcoin, explicado",
    excerpt: "A cada quatro anos a emissão de novas moedas cai pela metade. O que isso já fez com o preço no passado.",
    section: "bitcoin",
    tag: "Explicado",
    coins: ["bitcoin"],
    h: 130,
    views: 1400,
  },
];

export const MOCK_POSTS: Post[] = SEEDS.map((s) => ({
  slug: s.slug,
  title: s.title,
  excerpt: s.excerpt,
  section: s.section,
  tag: s.tag,
  coins: s.coins ?? [],
  level: s.level,
  publishedAt: hoursAgo(s.h),
  author: "Redação Vibecoin",
  readMinutes: s.read ?? 3,
  tags: s.coins?.length ? s.coins.map((c) => MOCK_COINS.find((x) => x.slug === c)?.name ?? c) : undefined,
  body: body(s.title.toLowerCase()),
  featured: s.featured,
  views: s.views ?? 500,
  source: { name: "Fonte de exemplo", url: "https://example.com" },
}));
