// Configuração central do site. Editorias e ferramentas alimentam rotas, menu e sitemap.

export const SITE = {
  name: "Vibecoin",
  tagline: "Cripto e finanças em reais, sem jargão",
  description:
    "Notícias de criptomoedas, cotações em reais, guias e ferramentas gratuitas (conversor, calculadora de IR, simulador de aporte). Informação clara para decidir melhor.",
  url: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? "https://vibecoin.com.br",
  locale: "pt_BR",
  email: "contato@vibecoin.com.br",
} as const;

/** Mantenha em sincronia com SECTION_SLUGS em app/routes.ts. */
export type SectionSlug = "noticias" | "bitcoin" | "altcoins" | "mercado" | "grana" | "regulacao" | "guias";

export interface Section {
  slug: SectionSlug;
  label: string;
  /** Rótulo curto usado como "kicker" nos cards. */
  kicker: string;
  description: string;
}

export const SECTIONS: Section[] = [
  {
    slug: "noticias",
    label: "Notícias",
    kicker: "Notícias",
    description: "O que acontece no mundo cripto e nas finanças, todo dia: mercado, empresas, tecnologia e bastidores.",
  },
  {
    slug: "bitcoin",
    label: "Bitcoin",
    kicker: "Bitcoin",
    description: "Tudo sobre a maior criptomoeda do mundo: preço, ETFs, mineração, halving e adoção.",
  },
  {
    slug: "altcoins",
    label: "Altcoins",
    kicker: "Altcoins",
    description: "Ethereum, Solana, XRP, memecoins e o resto do mercado além do bitcoin.",
  },
  {
    slug: "mercado",
    label: "Mercado",
    kicker: "Mercado",
    description: "O movimento dos preços, explicado: juros, dólar, fluxo de ETFs e o que mexe com o mercado cripto.",
  },
  {
    slug: "grana",
    label: "Grana",
    kicker: "Grana",
    description: "Finanças pessoais sem enrolação: reserva de emergência, renda fixa, impostos e planejamento.",
  },
  {
    slug: "regulacao",
    label: "Regulação",
    kicker: "Regulação",
    description: "Regras do Banco Central, da CVM e da Receita para cripto, Drex e o que muda para quem investe.",
  },
  {
    slug: "guias",
    label: "Guias",
    kicker: "Guia",
    description: "Do zero ao avançado: como comprar, guardar e declarar criptomoedas com segurança.",
  },
];

export const sectionBySlug = (slug: string) => SECTIONS.find((s) => s.slug === slug);

/** Nível dos guias (aparece no card). */
export type GuideLevel = 1 | 2 | 3;
export const LEVEL_LABEL: Record<GuideLevel, string> = { 1: "Iniciante", 2: "Intermediário", 3: "Avançado" };

export type ToolSlug = "conversor" | "calculadora-ir" | "simulador-aporte" | "comparador-corretoras";

export interface Tool {
  slug: ToolSlug;
  title: string;
  short: string;
  description: string;
  /** Código curto do card ("01 / conversor"). */
  code: string;
}

export const TOOLS: Tool[] = [
  {
    slug: "conversor",
    title: "Conversor de criptomoedas",
    short: "Conversor",
    description: "Qualquer cripto em reais (e o contrário), com a cotação do momento.",
    code: "01 / conversor",
  },
  {
    slug: "calculadora-ir",
    title: "Calculadora de IR para cripto",
    short: "Calculadora de IR",
    description: "Quanto você deve de imposto sobre o lucro com criptomoedas no mês.",
    code: "02 / ir",
  },
  {
    slug: "simulador-aporte",
    title: "Simulador de aporte mensal",
    short: "Simulador de aporte",
    description: "Quanto teria hoje quem investiu um valor fixo todo mês em cripto.",
    code: "03 / aporte",
  },
  {
    slug: "comparador-corretoras",
    title: "Comparador de corretoras",
    short: "Comparador de corretoras",
    description: "Taxas, Pix e recursos das corretoras de cripto lado a lado.",
    code: "04 / corretoras",
  },
];

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);

export const absoluteUrl = (path: string) => `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * Páginas institucionais (não dependem do banco). Alimentam rodapé, sitemap,
 * mapa do site e a navegação lateral entre documentos.
 */
export interface DocPage {
  to: string;
  label: string;
  group: "site" | "legal";
  /** Data da última revisão do texto (AAAA-MM-DD). */
  updated: string;
}

export const DOC_PAGES: DocPage[] = [
  { to: "/sobre", label: "Sobre", group: "site", updated: "2026-11-12" },
  { to: "/contato", label: "Contato", group: "site", updated: "2026-11-12" },
  { to: "/faq", label: "Perguntas frequentes", group: "site", updated: "2026-11-12" },
  { to: "/politica-editorial", label: "Política editorial", group: "site", updated: "2026-11-12" },
  { to: "/anuncie", label: "Anuncie", group: "site", updated: "2026-11-12" },
  { to: "/aviso-de-risco", label: "Aviso de risco", group: "legal", updated: "2026-11-12" },
  { to: "/termos", label: "Termos de uso", group: "legal", updated: "2026-11-12" },
  { to: "/privacidade", label: "Privacidade", group: "legal", updated: "2026-11-12" },
  { to: "/cookies", label: "Cookies", group: "legal", updated: "2026-11-12" },
  { to: "/acessibilidade", label: "Acessibilidade", group: "legal", updated: "2026-11-12" },
  { to: "/mapa-do-site", label: "Mapa do site", group: "legal", updated: "2026-11-12" },
];

export const docPage = (to: string) => DOC_PAGES.find((d) => d.to === to);

/** Link "mailto" com assunto preenchido, para separar os pedidos na caixa de entrada. */
export const mailto = (subject: string) => `mailto:${SITE.email}?subject=${encodeURIComponent(`[${subject}] `)}`;
