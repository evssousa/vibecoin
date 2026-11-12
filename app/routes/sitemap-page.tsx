import { Link } from "react-router";
import type { Route } from "./+types/sitemap-page";
import { StaticPage } from "~/components/StaticPage";
import { navFor, toolsFor, useAvailability } from "~/lib/availability";
import { getCoins } from "~/lib/content.server";
import { seo } from "~/lib/seo";
import { DOC_PAGES } from "~/lib/site";

export async function loader() {
  return { coins: (await getCoins()).map((c) => ({ slug: c.slug, name: c.name })) };
}

export const meta = () => seo({ title: "Mapa do site", description: "Todas as seções, cotações, ferramentas e páginas institucionais do Vibecoin.", path: "/mapa-do-site" });

export default function SitemapPage({ loaderData }: Route.ComponentProps) {
  const available = useAvailability();
  const groups = [
    { title: "Seções", links: [{ to: "/", label: "Início" }, ...navFor(available)] },
    { title: "Cotações", links: loaderData.coins.map((c) => ({ to: `/cotacoes/${c.slug}`, label: c.name })) },
    { title: "Ferramentas", links: toolsFor(available).map((t) => ({ to: `/ferramentas/${t.slug}`, label: t.title })) },
    { title: "Institucional e legal", links: DOC_PAGES },
  ];
  return (
    <StaticPage path="/mapa-do-site" title="Mapa do site" lead="Tudo o que existe no Vibecoin, em uma página.">
      <div className="grid gap-6 sm:grid-cols-2">
        {groups
          .filter((g) => g.links.length)
          .map((g) => (
            <section key={g.title} className="rounded-[22px] border border-line bg-card p-5">
              <h2 className="font-mono text-xs font-bold text-violet">&gt; {g.title.toUpperCase()}</h2>
              <ul className="mt-2">
                {g.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="flex min-h-11 items-center border-b border-line text-[15px] hover:text-violet">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </StaticPage>
  );
}
