import { Link } from "react-router";
import type { Route } from "./+types/home";
import { CoinCard, GuideCard, PostCard, ToolCard } from "~/components/cards";
import { Change, Chip, Kicker, SectionTitle, Spark } from "~/components/ui";
import { toolsFor, useAvailability } from "~/lib/availability";
import { getCoins, getFeatured, getMarket, listPosts } from "~/lib/content.server";
import { price } from "~/lib/money";
import { seo } from "~/lib/seo";
import { absoluteUrl, SECTIONS, SITE } from "~/lib/site";

export async function loader() {
  const featured = await getFeatured();
  const exclude = featured ? [featured.slug] : [];
  const [latest, guides, coins, market] = await Promise.all([
    listPosts({ exclude, perPage: 8 }),
    listPosts({ section: "guias", perPage: 4 }),
    getCoins(),
    getMarket(),
  ]);
  // Guias ficam na seção própria, fora das "Fresquinhas".
  const news = latest.items.filter((p) => p.section !== "guias");
  return { featured, subs: news.slice(0, 2), news: news.slice(2, 8), guides: guides.items, coins, market };
}

export function meta() {
  return [
    ...seo({ path: "/" }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE.name,
        url: SITE.url,
        inLanguage: "pt-BR",
        potentialAction: { "@type": "SearchAction", target: `${absoluteUrl("/busca")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
      },
    },
  ];
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { featured, subs, news, guides, coins, market } = loaderData;
  const available = useAvailability();
  const tools = toolsFor(available);
  const btc = coins.find((c) => c.slug === "bitcoin");
  const sections = SECTIONS.filter((s) => s.slug !== "guias" && available.sections.includes(s.slug));

  return (
    <main id="conteudo">
      <h1 className="sr-only">{SITE.name} — {SITE.tagline}</h1>

      {/* Noite: destaque, bitcoin e a vibe do mercado */}
      <section aria-label="Destaques" className="night bg-night text-moon">
        <div className="mx-auto flex max-w-[1280px] flex-wrap gap-5 px-4 pt-6 pb-14 sm:px-6 sm:pt-8">
          {featured ? (
            <article className="flex min-w-0 flex-[2_1_520px] flex-col gap-4">
              <span className="w-fit rounded-full bg-violet px-2.5 py-1 font-mono text-xs font-bold text-white">
                DESTAQUE · {featured.ago}
              </span>
              <h2 className="text-[34px] leading-[1.06] font-extrabold tracking-[-0.035em] sm:text-[50px]">
                <Link to={featured.url} className="hover:text-glow">
                  {featured.title}
                </Link>
              </h2>
              <p className="max-w-[640px] text-lg leading-relaxed text-[#c3b8dc]">{featured.excerpt}</p>
              {subs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-5">
                  {subs.map((p) => (
                    <Link key={p.url} to={p.url} className="group flex flex-[1_1_240px] flex-col gap-1.5 border-t-2 border-glow pt-3">
                      <Kicker mode="night">
                        {p.kicker} · {p.ago}
                      </Kicker>
                      <span className="text-[17px] leading-snug font-bold group-hover:text-glow">{p.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ) : (
            <div className="flex-[2_1_520px]">
              <p className="eyebrow text-glow">As primeiras matérias chegam em breve</p>
            </div>
          )}

          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-3.5">
            {btc && (
              <Link to="/cotacoes/bitcoin" className="flex flex-col gap-2 rounded-[22px] border border-night-line bg-night-2 p-[22px] hover:border-night-line-2">
                <span className="flex justify-between font-mono text-[13px]">
                  <span className="text-moon-muted">BTC/BRL</span>
                  <Change value={btc.change24h} mode="night" />
                </span>
                <span className="num text-4xl font-bold">{price(btc.priceBrl)}</span>
                <Spark values={btc.spark7d} change={btc.change7d} mode="night" width={300} height={80} className="h-20 w-full" />
                <span className="font-mono text-xs text-moon-muted">últimos 7 dias · ver cotação →</span>
              </Link>
            )}
            {market && (
              <div className="flex items-center justify-between gap-3 rounded-[22px] bg-lime p-[22px] text-night">
                <span className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs font-bold">A VIBE DO MERCADO</span>
                  <span className="text-xl font-extrabold">{market.fearGreed.label}</span>
                  <span className="text-xs font-semibold">Índice de medo e ganância · ontem {market.fearGreed.yesterday}</span>
                </span>
                <span className="num text-[44px] font-bold" aria-label={`${market.fearGreed.value} de 100`}>
                  {market.fearGreed.value}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Dia: ferramentas, moedas, notícias e guias */}
      <div className="mx-auto flex max-w-[1280px] flex-col gap-14 px-4 pt-12 sm:px-6">
        {tools.length > 0 && (
          <section className="flex flex-col gap-[18px]">
            <SectionTitle action={{ to: "/ferramentas", label: "Todas" }}>Ferramentas</SectionTitle>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              {tools.map((t, i) => (
                <ToolCard key={t.slug} tool={t} index={i} />
              ))}
            </div>
          </section>
        )}

        {coins.length > 0 && (
          <section aria-labelledby="moedas" className="flex flex-col gap-[18px]">
            <SectionTitle action={{ to: "/cotacoes", label: "Todas as cotações" }}>
              <span id="moedas">Cotações em reais</span>
            </SectionTitle>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
              {coins
                .filter((c) => !c.stable)
                .slice(0, 6)
                .map((c) => (
                  <CoinCard key={c.slug} coin={c} />
                ))}
            </div>
          </section>
        )}

        {news.length > 0 && (
          <section className="flex flex-col gap-[18px]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-[28px] font-extrabold tracking-[-0.02em] sm:text-[30px]">Fresquinhas</h2>
              <nav aria-label="Editorias" className="flex flex-wrap gap-1.5">
                <Chip to="/noticias" active>
                  Tudo
                </Chip>
                {sections
                  .filter((s) => s.slug !== "noticias")
                  .map((s) => (
                    <Chip key={s.slug} to={`/${s.slug}`} active={false}>
                      {s.label}
                    </Chip>
                  ))}
              </nav>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
              {news.map((p) => (
                <PostCard key={p.url} post={p} />
              ))}
            </div>
          </section>
        )}

        {guides.length > 0 && (
          <section className="flex flex-col gap-[18px]">
            <SectionTitle action={{ to: "/guias", label: "Todos os guias" }}>Aprenda do zero</SectionTitle>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
              {guides.map((p) => (
                <GuideCard key={p.url} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
