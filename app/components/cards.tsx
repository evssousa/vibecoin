import { Link } from "react-router";
import { compactBrl, price } from "~/lib/money";
import { LEVEL_LABEL, type Tool } from "~/lib/site";
import type { Coin, PostView } from "~/lib/types";
import { Change, Cover, Kicker, Spark, cx } from "./ui";

/** Card de matéria com imagem (grades de notícias). */
export function PostCard({ post }: { post: PostView }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[22px] border border-line bg-card">
      <Link to={post.url} tabIndex={-1} aria-hidden>
        <Cover image={post.image} className="h-40" />
      </Link>
      <div className="flex flex-col gap-2 p-[18px]">
        <Kicker>
          {post.kicker} · {post.ago}
        </Kicker>
        <h3 className="text-[19px] font-extrabold leading-snug">
          <Link to={post.url} className="block hover:text-violet">
            {post.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}

/** Linha de matéria com miniatura (listas). */
export function PostRow({ post, excerpt = false }: { post: PostView; excerpt?: boolean }) {
  return (
    <article className="flex items-center gap-4 border-b border-line py-4">
      <Link to={post.url} tabIndex={-1} aria-hidden className="shrink-0">
        <Cover image={post.image} className="h-[64px] w-[84px] rounded-xl sm:h-[76px] sm:w-[112px]" />
      </Link>
      <div className="flex min-w-0 flex-col gap-1.5">
        <Kicker>
          {post.kicker} · {post.ago}
        </Kicker>
        <h3 className="text-base leading-[1.5] font-bold sm:text-[17px]">
          <Link to={post.url} className="block hover:text-violet">
            {post.title}
          </Link>
        </h3>
        {excerpt && <p className="hidden text-[15px] leading-relaxed text-muted sm:block">{post.excerpt}</p>}
      </div>
    </article>
  );
}

/** Lista "Mais lidas" (lateral). */
export function MostRead({ posts }: { posts: PostView[] }) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="mais-lidas" className="rounded-[22px] border border-line bg-card p-5">
      <h2 id="mais-lidas" className="font-mono text-xs font-bold text-violet">
        &gt; MAIS LIDAS
      </h2>
      <ol className="mt-2 flex flex-col">
        {posts.map((p, i) => (
          <li key={p.url} className="flex gap-3 border-b border-line py-3 last:border-0">
            <span className="num text-xl font-bold text-violet">{i + 1}</span>
            <Link to={p.url} className="text-[15px] font-semibold leading-snug hover:text-violet">
              {p.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Card de moeda: símbolo, minigráfico, preço e variação. */
export function CoinCard({ coin }: { coin: Coin }) {
  return (
    <Link to={`/cotacoes/${coin.slug}`} className="flex flex-col gap-1.5 rounded-[18px] border border-line bg-card p-4 hover:border-violet">
      <span className="flex items-center justify-between gap-2">
        <span className="font-extrabold">{coin.symbol}</span>
        <Spark values={coin.spark7d} change={coin.change7d} width={56} height={20} />
      </span>
      <span className="num text-[15px]">R$ {price(coin.priceBrl)}</span>
      <Change value={coin.change24h} className="text-[13px]" />
    </Link>
  );
}

/** Tabela de mercado (página de cotações). */
export function CoinTable({ coins }: { coins: Coin[] }) {
  return (
    // relative: sem ele, a <caption> sr-only (absoluta) escapa da caixa de rolagem e alarga a página no celular.
    <div className="relative overflow-x-auto rounded-[20px] border border-line bg-card">
      <table className="w-full min-w-[760px] border-collapse text-[15px]">
        <caption className="sr-only">Cotações em reais, variação em 24 horas e 7 dias e valor de mercado</caption>
        <thead>
          <tr className="bg-[#f6f4fd] text-right text-xs text-muted">
            <th scope="col" className="px-5 py-3 text-left font-semibold">
              # Moeda
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Preço
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              24h
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              7d
            </th>
            <th scope="col" className="px-3 py-3 font-semibold">
              Valor de mercado
            </th>
            <th scope="col" className="px-5 py-3 font-semibold">
              <span className="sr-only">Gráfico de </span>7 dias
            </th>
          </tr>
        </thead>
        <tbody>
          {coins.map((c) => (
            <tr key={c.slug} className="border-t border-line text-right">
              <td className="px-5 py-3.5 text-left">
                <Link to={`/cotacoes/${c.slug}`} className="flex items-center gap-3 hover:text-violet">
                  <span className="num w-5 text-muted">{c.rank}</span>
                  <CoinMark symbol={c.symbol} />
                  <span className="font-bold">{c.name}</span>
                  <span className="text-[13px] text-muted">{c.symbol}</span>
                </Link>
              </td>
              <td className="num px-3 py-3.5 font-semibold">R$ {price(c.priceBrl)}</td>
              <td className="px-3 py-3.5">
                <Change value={c.change24h} />
              </td>
              <td className="px-3 py-3.5">
                <Change value={c.change7d} />
              </td>
              <td className="num px-3 py-3.5 text-[#3b3456]">{compactBrl(c.marketCapBrl)}</td>
              <td className="px-5 py-3.5">
                <Spark values={c.spark7d} change={c.change7d} className="ml-auto" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Bolinha com a inicial do símbolo (até termos os logos). */
export function CoinMark({ symbol, className }: { symbol: string; className?: string }) {
  return (
    <span aria-hidden className={cx("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-soft text-xs font-extrabold text-violet", className)}>
      {symbol.charAt(0)}
    </span>
  );
}

const TOOL_STYLE = [
  "bg-lime text-night border-lime",
  "bg-ink text-moon border-ink",
  "bg-violet text-white border-violet",
  "bg-card text-ink border-line-2 hover:border-violet",
];

/** Card colorido de ferramenta (home e /ferramentas). */
export function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  return (
    <Link to={`/ferramentas/${tool.slug}`} className={cx("flex min-h-40 flex-col gap-2 rounded-[24px] border p-6 transition-transform hover:-translate-y-0.5", TOOL_STYLE[index % TOOL_STYLE.length])}>
      <span className="font-mono text-xs font-bold">{tool.code}</span>
      <span className="text-xl font-extrabold">{tool.short}</span>
      <span className="text-sm leading-relaxed">{tool.description}</span>
      <span className="mt-auto pt-2 font-bold">Abrir →</span>
    </Link>
  );
}

/** Card de guia com o nível. */
export function GuideCard({ post }: { post: PostView }) {
  return (
    <Link to={post.url} className="flex min-h-36 flex-col gap-2.5 rounded-[22px] border border-line bg-card p-[22px] hover:border-violet">
      {post.level && <span className="w-fit rounded-full bg-violet-soft px-2.5 py-1 text-xs font-bold text-violet">Nível {post.level} · {LEVEL_LABEL[post.level]}</span>}
      <span className="text-lg font-extrabold leading-snug">{post.title}</span>
      <span className="mt-auto text-sm text-muted">{post.readMinutes} min de leitura</span>
    </Link>
  );
}

export function Pagination({ page, totalPages, pathname, search }: { page: number; totalPages: number; pathname: string; search: string }) {
  if (totalPages <= 1) return null;
  const href = (n: number) => {
    const params = new URLSearchParams(search);
    if (n === 1) params.delete("pagina");
    else params.set("pagina", String(n));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };
  const cls = "inline-flex min-h-11 items-center rounded-xl border border-line-2 bg-card px-4 text-sm font-bold hover:border-violet hover:text-violet";
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link to={href(page - 1)} className={cls} rel="prev">
          ← Anteriores
        </Link>
      ) : (
        <span />
      )}
      <span className="num text-sm text-muted">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link to={href(page + 1)} className={cls} rel="next">
          Próximas →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
