import type { GuideLevel, SectionSlug } from "./site";

/**
 * Blocos do corpo. Em p, ul e quote o texto aceita links no formato [texto](url):
 * url começando com "/" é link interno; o resto abre em outra aba.
 */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "img"; src: string; alt: string; width?: number; height?: number; credit?: string }
  | { type: "video"; youtubeId: string; title: string };

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  section: SectionSlug;
  /** Rótulo opcional que substitui o da seção no card (ex.: "Análise", "Explicado"). */
  tag?: string;
  /** Moedas citadas (slugs de Coin): ligam a matéria à página da moeda. */
  coins: string[];
  /** Só nos guias. */
  level?: GuideLevel;
  publishedAt: string; // ISO
  updatedAt?: string; // ISO
  author: string;
  readMinutes: number;
  image?: { src: string; alt: string; credit?: string };
  /** SEO: descrição para o Google (120–160 caracteres); sem ela, usa o excerpt. */
  metaDescription?: string;
  focusKeyword?: string;
  tags?: string[];
  body: Block[];
  featured?: boolean;
  views: number;
  /** Só na pré-visualização do admin (rascunho/arquivada). */
  status?: string;
  source?: { name: string; url: string };
}

/** Post como chega nos componentes: com textos de data já calculados no servidor. */
export interface PostView extends Omit<Post, "body"> {
  url: string;
  kicker: string;
  ago: string;
  dateLabel: string;
  /** Horário de publicação, ex.: "09:12". */
  timeLabel: string;
}

/** Uma criptomoeda com a cotação do momento. */
export interface Coin {
  slug: string;
  symbol: string;
  name: string;
  rank: number;
  priceBrl: number;
  priceUsd: number;
  /** Variação percentual (ex.: 2.4 = +2,4%). */
  change24h: number;
  change7d: number;
  marketCapBrl: number;
  volume24hBrl: number;
  /** Preços dos últimos 7 dias (em reais), do mais antigo ao mais novo, para o minigráfico. */
  spark7d: number[];
  description: string;
  /** Texto próprio da página da moeda (só em getCoin; nas listagens fica vazio). */
  about?: CoinAbout | null;
  /** Moeda atrelada ao dólar (não faz sentido no simulador). */
  stable?: boolean;
  updatedAt: string; // ISO
}

/** Texto próprio da página de cotação: para que serve, oferta, fatos e riscos. */
export interface CoinAbout {
  uso: string;
  oferta: string;
  fatos: [string, string][];
  riscos: string;
  /** Guia do site sobre a moeda, se houver. */
  guia?: { href: string; titulo: string };
}

/** Fechamento mensal em reais (simulador de aporte). */
export interface MonthlyPrice {
  month: string; // AAAA-MM
  priceBrl: number;
}

/** Panorama do mercado (barra do topo e destaque da home). */
export interface MarketOverview {
  totalMarketCapBrl: number;
  change24h: number;
  btcDominance: number;
  usdBrl: number;
  usdBrlChange24h: number;
  /** Índice de medo e ganância (0–100), da alternative.me. */
  fearGreed: { value: number; yesterday: number; label: string };
  updatedAt: string; // ISO
}

/** Corretora no comparador (dados conferidos à mão, com data). */
export interface Broker {
  slug: string;
  name: string;
  url: string;
  /** Taxas de negociação em %, como a corretora divulga. */
  makerFee: number;
  takerFee: number;
  pixDeposit: string;
  pixWithdraw: string;
  coins: number;
  features: string[];
  checkedAt: string; // AAAA-MM-DD
}
