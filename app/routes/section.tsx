import { data, useLocation } from "react-router";
import type { Route } from "./+types/section";
import { GuideCard, MostRead, Pagination, PostRow } from "~/components/cards";
import { Chip, SectionTitle } from "~/components/ui";
import { useAvailability } from "~/lib/availability";
import { getMostRead, listPosts } from "~/lib/content.server";
import { firstSegment } from "~/lib/route-path";
import { seo } from "~/lib/seo";
import { LEVEL_LABEL, SECTIONS, sectionBySlug, type GuideLevel } from "~/lib/site";

const LEVELS: GuideLevel[] = [1, 2, 3];
/** ?nivel=1|2|3 (qualquer outro valor mostra todos). */
const parseLevel = (v: string | null): GuideLevel | undefined => LEVELS.find((l) => String(l) === v);

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const section = sectionBySlug(firstSegment(request));
  if (!section) throw data("Seção não encontrada", { status: 404 });
  const page = Number(url.searchParams.get("pagina")) || 1;
  // Guias: tudo numa página só, agrupado por nível; ?nivel= mostra um nível. Os contadores dos botões vêm da lista completa.
  if (section.slug === "guias") {
    const level = parseLevel(url.searchParams.get("nivel"));
    const everything = await listPosts({ section: "guias", perPage: 60 });
    const posts = level ? await listPosts({ section: "guias", level, page, perPage: 60 }) : everything;
    const counts = Object.fromEntries(LEVELS.map((l) => [l, everything.items.filter((p) => p.level === l).length])) as Record<GuideLevel, number>;
    return { section, posts, mostRead: [], level: level ?? null, counts };
  }
  // "Notícias" é o feed geral: mostra as matérias de todas as editorias.
  const [posts, mostRead] = await Promise.all([
    section.slug === "noticias" ? listPosts({ page, perPage: 15 }) : listPosts({ section: section.slug, page, perPage: 15 }),
    getMostRead(5),
  ]);
  return { section, posts, mostRead, level: null, counts: null };
}

export function meta({ loaderData, location }: Route.MetaArgs) {
  if (!loaderData) return [];
  const { section, posts, level } = loaderData;
  return seo({
    title: level ? `${section.label}: nível ${LEVEL_LABEL[level].toLowerCase()}` : posts.page > 1 ? `${section.label} — página ${posts.page}` : section.label,
    description: section.description,
    path: location.pathname + (posts.page > 1 ? `?pagina=${posts.page}` : ""),
    // A lista filtrada é a mesma página com menos itens: não indexa para não duplicar /guias.
    noindex: posts.total === 0 || Boolean(level),
  });
}

export default function SectionPage({ loaderData }: Route.ComponentProps) {
  const { section, posts, mostRead, level, counts } = loaderData;
  const location = useLocation();
  const available = useAvailability();
  const isGuides = section.slug === "guias";

  return (
    <main id="conteudo" className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 pt-10 sm:px-6">
      <div className="flex flex-col gap-4">
        <SectionTitle as="h1" size="xl">
          {section.label}
        </SectionTitle>
        <p className="max-w-2xl text-lg text-muted">{section.description}</p>
        <nav aria-label="Editorias" className="flex flex-wrap gap-1.5">
          {SECTIONS.filter((s) => available.sections.includes(s.slug)).map((s) => (
            <Chip key={s.slug} to={`/${s.slug}`} active={s.slug === section.slug}>
              {s.slug === "noticias" ? "Tudo" : s.label}
            </Chip>
          ))}
        </nav>
      </div>

      {isGuides ? (
        <div className="flex flex-col gap-8">
          <nav aria-label="Filtrar guias por nível" className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-sm font-semibold text-muted">Nível</span>
            <Chip to={location.pathname} active={!level}>
              Todos <span className="num ml-1.5 opacity-70">{counts ? LEVELS.reduce((n, l) => n + counts[l], 0) : 0}</span>
            </Chip>
            {LEVELS.filter((l) => counts && counts[l] > 0).map((l) => (
              <Chip key={l} to={`${location.pathname}?nivel=${l}`} active={level === l}>
                {LEVEL_LABEL[l]} <span className="num ml-1.5 opacity-70">{counts?.[l]}</span>
              </Chip>
            ))}
          </nav>
          {posts.items.length === 0 ? (
            <Empty />
          ) : level ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {posts.items.map((p) => (
                <GuideCard key={p.url} post={p} />
              ))}
            </div>
          ) : (
            LEVELS.map((l) => {
              const group = posts.items.filter((p) => p.level === l);
              const rest = l === 1 ? posts.items.filter((p) => !p.level) : [];
              const items = [...group, ...rest];
              if (!items.length) return null;
              return (
                <section key={l} aria-labelledby={`nivel-${l}`} className="flex flex-col gap-4">
                  <h2 id={`nivel-${l}`} className="text-xl font-extrabold">
                    Nível {l} · {LEVEL_LABEL[l]}
                  </h2>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                    {items.map((p) => (
                      <GuideCard key={p.url} post={p} />
                    ))}
                  </div>
                </section>
              );
            })
          )}
          <Pagination page={posts.page} totalPages={posts.totalPages} pathname={location.pathname} search={location.search} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-10">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col">
            {posts.items.length === 0 ? <Empty /> : posts.items.map((p) => <PostRow key={p.url} post={p} excerpt />)}
            <div className="mt-6">
              <Pagination page={posts.page} totalPages={posts.totalPages} pathname={location.pathname} search={location.search} />
            </div>
          </div>
          <aside className="flex-[1_1_300px]">
            <MostRead posts={mostRead} />
          </aside>
        </div>
      )}
    </main>
  );
}

function Empty() {
  return <p className="rounded-[22px] border border-line bg-card px-6 py-10 text-lg text-muted">Nenhuma matéria por aqui ainda. Volte em breve!</p>;
}
