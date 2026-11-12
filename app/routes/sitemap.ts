import { getAllPosts, getAvailability, getCoins, postUrl } from "~/lib/content.server";
import { navFor, toolsFor } from "~/lib/availability";
import { absoluteUrl, DOC_PAGES } from "~/lib/site";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function loader() {
  // Só páginas com conteúdo (editorias e ferramentas sem dados ficam de fora).
  const [posts, coins, available] = await Promise.all([getAllPosts(), getCoins(), getAvailability()]);
  const entries: { loc: string; lastmod?: string; changefreq?: string }[] = [
    { loc: "/", changefreq: "hourly" },
    ...navFor(available).map((n) => ({ loc: n.to, changefreq: "hourly" })),
    ...coins.map((c) => ({ loc: `/cotacoes/${c.slug}`, changefreq: "hourly" })),
    ...toolsFor(available).map((t) => ({ loc: `/ferramentas/${t.slug}`, changefreq: "weekly" })),
    ...posts.map((p) => ({ loc: postUrl(p), lastmod: p.updatedAt ?? p.publishedAt })),
    ...DOC_PAGES.map((d) => ({ loc: d.to, lastmod: d.updated, changefreq: "yearly" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) =>
      `  <url><loc>${esc(absoluteUrl(e.loc))}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}${e.changefreq ? `<changefreq>${e.changefreq}</changefreq>` : ""}</url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
