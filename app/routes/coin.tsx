import { data, Link } from "react-router";
import type { Route } from "./+types/coin";
import { CoinMark, PostRow } from "~/components/cards";
import { Change, Spark } from "~/components/ui";
import { getCoin, listPosts } from "~/lib/content.server";
import { formatDateTime } from "~/lib/format";
import { brl, compactBrl, price, usd } from "~/lib/money";
import { seo } from "~/lib/seo";
import { absoluteUrl } from "~/lib/site";

export async function loader({ params }: Route.LoaderArgs) {
  const coin = await getCoin(params.slug);
  if (!coin) throw data("Moeda não encontrada", { status: 404 });
  const news = await listPosts({ coin: coin.slug, perPage: 6 });
  return { coin, news: news.items };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [];
  const { coin } = loaderData;
  const path = `/cotacoes/${coin.slug}`;
  return [
    ...seo({
      title: `Cotação do ${coin.name} (${coin.symbol}) hoje em reais`,
      description: `Preço do ${coin.name} (${coin.symbol}) hoje em reais e dólar, variação em 24 horas e 7 dias, valor de mercado e as últimas notícias.`,
      path,
    }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Cotações", item: absoluteUrl("/cotacoes") },
          { "@type": "ListItem", position: 2, name: coin.name, item: absoluteUrl(path) },
        ],
      },
    },
  ];
}

export default function CoinPage({ loaderData }: Route.ComponentProps) {
  const { coin, news } = loaderData;
  return (
    <main id="conteudo" className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 pt-8 sm:px-6">
      <nav aria-label="Você está em" className="text-sm font-semibold text-muted">
        <Link to="/cotacoes" className="-my-3 inline-block py-3 hover:text-violet">
          Cotações
        </Link>
        <span aria-hidden> / </span>
        {coin.name}
      </nav>

      <div className="flex flex-wrap gap-6">
        <section className="flex min-w-0 flex-[2_1_520px] flex-col gap-5 rounded-[24px] border border-line bg-card p-6">
          <div className="flex flex-wrap items-center gap-3">
            <CoinMark symbol={coin.symbol} className="h-11 w-11 text-base" />
            <h1 className="text-3xl font-extrabold tracking-[-0.02em]">
              {coin.name} <span className="text-xl font-semibold text-muted">{coin.symbol}</span>
            </h1>
            <span className="rounded-full bg-violet-soft px-2.5 py-1 text-xs font-bold text-violet">#{coin.rank}</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="num text-4xl font-bold sm:text-5xl">{brl(coin.priceBrl)}</span>
            <Change value={coin.change24h} className="text-lg" />
            <span className="text-sm text-muted">em 24h</span>
          </div>
          <p className="num text-sm text-muted">{usd(coin.priceUsd)}</p>
          <div>
            <p className="mb-2 text-sm font-semibold text-muted">
              Últimos 7 dias · <Change value={coin.change7d} />
            </p>
            <Spark values={coin.spark7d} change={coin.change7d} width={600} height={160} className="h-40 w-full" />
          </div>
          <p className="text-xs text-muted">Atualizado em {formatDateTime(coin.updatedAt)}. Cotação de referência; o preço na corretora pode variar.</p>
        </section>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="Valor de mercado">{compactBrl(coin.marketCapBrl)}</Stat>
            <Stat label="Volume em 24h">{compactBrl(coin.volume24hBrl)}</Stat>
            <Stat label="Variação 24h">
              <Change value={coin.change24h} />
            </Stat>
            <Stat label="Variação 7d">
              <Change value={coin.change7d} />
            </Stat>
          </dl>
          <Link
            to={`/ferramentas/conversor?moeda=${coin.slug}`}
            className="flex flex-col gap-1 rounded-[22px] bg-lime p-5 text-night transition-transform hover:-translate-y-0.5"
          >
            <span className="font-mono text-xs font-bold">01 / conversor</span>
            <span className="text-lg font-extrabold">Converter {coin.symbol} para reais</span>
            <span className="num text-sm">1 {coin.symbol} = R$ {price(coin.priceBrl)}</span>
          </Link>
        </aside>
      </div>

      <section className="max-w-3xl">
        <h2 className="text-2xl font-extrabold tracking-[-0.02em]">O que é {coin.name}</h2>
        <p className="mt-3 text-lg leading-relaxed text-[#2c2545]">{coin.description}</p>
      </section>

      {news.length > 0 && (
        <section className="flex max-w-3xl flex-col">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Notícias sobre {coin.name}</h2>
          {news.map((p) => (
            <PostRow key={p.url} post={p} />
          ))}
        </section>
      )}
    </main>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-[18px] border border-line bg-card p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="num text-lg font-bold">{children}</dd>
    </div>
  );
}
