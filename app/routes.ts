import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Editorias de posts: cada uma tem listagem (/bitcoin) e página de post (/bitcoin/:slug).
// Mantenha em sincronia com SECTIONS em app/lib/site.ts.
const SECTION_SLUGS = ["noticias", "bitcoin", "altcoins", "mercado", "grana", "regulacao", "guias"] as const;

export default [
  index("routes/home.tsx"),
  ...SECTION_SLUGS.flatMap((slug) => [
    route(slug, "routes/section.tsx", { id: `section-${slug}` }),
    route(`${slug}/:slug`, "routes/post.tsx", { id: `post-${slug}` }),
  ]),
  route("cotacoes", "routes/quotes.tsx"),
  route("cotacoes/:slug", "routes/coin.tsx"),
  route("ferramentas", "routes/tools.tsx"),
  route("ferramentas/conversor", "routes/tool-converter.tsx"),
  route("ferramentas/calculadora-ir", "routes/tool-tax.tsx"),
  route("ferramentas/simulador-aporte", "routes/tool-dca.tsx"),
  route("ferramentas/comparador-corretoras", "routes/tool-brokers.tsx"),
  route("busca", "routes/search.tsx"),
  route("sobre", "routes/about.tsx"),
  route("contato", "routes/contact.tsx"),
  route("faq", "routes/faq.tsx"),
  route("politica-editorial", "routes/editorial.tsx"),
  route("anuncie", "routes/advertise.tsx"),
  route("aviso-de-risco", "routes/risk.tsx"),
  route("termos", "routes/terms.tsx"),
  route("privacidade", "routes/privacy.tsx"),
  route("cookies", "routes/cookies.tsx"),
  route("acessibilidade", "routes/accessibility.tsx"),
  route("mapa-do-site", "routes/sitemap-page.tsx"),

  // Recursos para buscadores e leitores de feed.
  route("sitemap.xml", "routes/sitemap.ts"),
  route("rss.xml", "routes/rss.ts"),
  route("robots.txt", "routes/robots.ts"),
  route("ads.txt", "routes/ads-txt.ts"),

  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
