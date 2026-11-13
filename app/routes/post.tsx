import { useEffect } from "react";
import { data, Link } from "react-router";
import type { Route } from "./+types/post";
import { CoinCard, MostRead, PostCard } from "~/components/cards";
import { BodyBlock } from "~/components/RichText";
import { ShareButtons } from "~/components/ShareButtons";
import { Cover, Kicker, SectionTitle } from "~/components/ui";
import { isAdmin } from "~/lib/admin/auth.server";
import { getCoin, getMostRead, getPost, listPosts } from "~/lib/content.server";
import { formatDate, formatDateTime } from "~/lib/format";
import { firstSegment } from "~/lib/route-path";
import { seo } from "~/lib/seo";
import { absoluteUrl, LEVEL_LABEL, SITE, sectionBySlug } from "~/lib/site";
import type { Coin } from "~/lib/types";

// Pré-visualização: ?previa=1 com o admin logado mostra rascunho/arquivada com o visual do site.
// Sem sessão, o parâmetro é ignorado (rascunho continua 404). Nunca indexa nem entra em cache.
export async function loader({ params, request }: Route.LoaderArgs) {
  const preview = new URL(request.url).searchParams.get("previa") === "1" && (await isAdmin(request));
  const post = await getPost(firstSegment(request), params.slug, preview);
  if (!post) throw data("Post não encontrado", { status: 404 });
  const [coins, related, mostRead] = await Promise.all([
    Promise.all(post.coins.map((c) => getCoin(c))),
    listPosts({ section: post.section, exclude: [post.slug], perPage: 3 }),
    getMostRead(5, [post.slug]),
  ]);
  const result = { post, coins: coins.filter((c): c is Coin => c !== null), related: related.items, mostRead, section: sectionBySlug(post.section)!, preview };
  return preview ? data(result, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } }) : result;
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return loaderHeaders;
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [];
  const { post, section, coins } = loaderData;
  if (loaderData.preview) return [{ title: `Prévia: ${post.title}` }, { name: "robots", content: "noindex, nofollow" }];
  const url = absoluteUrl(post.url);
  return [
    ...seo({
      title: post.title,
      description: post.metaDescription ?? post.excerpt,
      path: post.url,
      image: post.image?.src,
      type: "article",
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": post.section === "guias" ? "Article" : "NewsArticle",
        headline: post.title,
        description: post.metaDescription ?? post.excerpt,
        articleSection: section.label,
        ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}),
        datePublished: post.publishedAt,
        dateModified: post.updatedAt ?? post.publishedAt,
        author: { "@type": "Organization", name: post.author },
        publisher: { "@type": "Organization", name: SITE.name, url: SITE.url, logo: { "@type": "ImageObject", url: absoluteUrl("/logo-512.png"), width: 512, height: 512 } },
        mainEntityOfPage: url,
        inLanguage: "pt-BR",
        ...(post.image ? { image: [absoluteUrl(post.image.src)] } : {}),
        ...(coins.length ? { about: coins.map((c) => ({ "@type": "Thing", name: c.name })) } : {}),
      },
    },
  ];
}

export default function PostPage({ loaderData }: Route.ComponentProps) {
  const { post, coins, related, mostRead, section, preview } = loaderData;
  // Conta a visita depois de abrir no navegador (bots e pré-carregamentos não contam).
  useEffect(() => {
    if (preview) return;
    const body = JSON.stringify({ path: post.url });
    if (!navigator.sendBeacon?.("/api/view", new Blob([body], { type: "application/json" })))
      fetch("/api/view", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }, [post.url, preview]);

  return (
    <main id="conteudo" className="mx-auto flex max-w-[1280px] flex-col gap-14 px-4 pt-8 sm:px-6">
      {preview && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet bg-violet-soft px-4 py-3 text-sm">
          <span className="font-bold text-violet">
            Pré-visualização · {post.status === "published" ? "no ar" : post.status === "archived" ? "arquivada" : "rascunho"} · só você vê esta página
          </span>
          <span className="text-muted">Data e "mais lidas" são provisórias até publicar.</span>
        </div>
      )}
      <article className="flex flex-col gap-8">
        <nav aria-label="Você está em" className="text-sm font-semibold text-muted">
          <Link to="/" className="-my-3 inline-block py-3 hover:text-violet">
            Início
          </Link>
          <span aria-hidden> / </span>
          <Link to={`/${section.slug}`} className="-my-3 inline-block py-3 hover:text-violet">
            {section.label}
          </Link>
        </nav>

        <header className="flex max-w-4xl flex-col gap-5">
          <Kicker>
            {post.kicker}
            {post.level ? ` · Nível ${post.level} (${LEVEL_LABEL[post.level]})` : ""}
          </Kicker>
          <h1 className="text-4xl leading-[1.06] font-extrabold tracking-[-0.03em] sm:text-[54px]">{post.title}</h1>
          <p className="max-w-3xl text-xl leading-relaxed text-muted">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-3 font-mono text-xs text-muted">
            <span>POR {post.author.toUpperCase()}</span>
            <time dateTime={post.publishedAt}>{formatDateTime(post.publishedAt)}</time>
            <span>{post.readMinutes} MIN DE LEITURA</span>
          </div>
        </header>

        <figure className="flex flex-col gap-2">
          <Cover image={post.image} eager className="aspect-[16/9] w-full rounded-[24px] sm:aspect-[21/9]" />
          {post.image?.credit && <figcaption className="text-xs text-muted">{post.image.credit}</figcaption>}
        </figure>

        <div className="flex flex-wrap gap-12">
          <div className="min-w-0 max-w-[720px] flex-[999_1_560px]">
            <div className="article-body">
              {post.body.map((b, i) => (
                <BodyBlock key={i} block={b} />
              ))}
            </div>

            <p className="mt-8 rounded-[18px] bg-violet-soft p-4 text-sm leading-relaxed text-[#3b3456]">
              <strong className="text-ink">Conteúdo informativo.</strong> Nada aqui é recomendação de compra ou venda. Criptomoedas são voláteis e você pode perder
              dinheiro. Leia o{" "}
              <Link to="/aviso-de-risco" className="font-semibold text-violet underline underline-offset-2">
                aviso de risco
              </Link>
              .
            </p>

            <div className="mt-8 flex flex-col gap-6 border-t border-line pt-6">
              {post.tags && post.tags.length > 0 && (
                <ul aria-label="Tópicos" className="flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <li key={t}>
                      <Link to={`/busca?q=${encodeURIComponent(t)}`} className="inline-flex min-h-9 items-center rounded-full border border-line-2 bg-card px-3 text-sm hover:border-violet hover:text-violet">
                        #{t}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <ShareButtons url={absoluteUrl(post.url)} title={post.title} />
              {post.source && (
                <p className="text-sm text-muted">
                  Fonte:{" "}
                  <a href={post.source.url} rel="noopener nofollow" target="_blank" className="font-semibold text-ink underline hover:text-violet">
                    {post.source.name}
                  </a>
                </p>
              )}
              {post.updatedAt && <p className="text-sm text-muted">Atualizado em {formatDate(post.updatedAt)}</p>}
            </div>
          </div>

          <aside className="flex flex-[1_1_300px] flex-col gap-6">
            {coins.length > 0 && (
              <section aria-labelledby="moedas-citadas" className="flex flex-col gap-3">
                <h2 id="moedas-citadas" className="eyebrow text-violet">
                  MOEDAS NESTA MATÉRIA
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {coins.map((c) => (
                    <CoinCard key={c.slug} coin={c} />
                  ))}
                </div>
              </section>
            )}
            <MostRead posts={mostRead} />
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="flex flex-col gap-6">
          <SectionTitle action={{ to: `/${section.slug}`, label: `Mais em ${section.label}` }}>Leia também</SectionTitle>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
            {related.map((p) => (
              <PostCard key={p.url} post={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
