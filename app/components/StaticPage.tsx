import type { ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { formatDate } from "~/lib/format";
import { DOC_PAGES, docPage } from "~/lib/site";
import { cx } from "./ui";

/** Uma seção do documento: vira um <h2> com âncora e um item do índice. */
export interface DocSection {
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * Layout das páginas institucionais (sobre, contato, termos, privacidade...).
 * Índice das seções (fixo no desktop, recolhível no celular) e navegação entre os documentos.
 */
export function StaticPage({
  path,
  title,
  lead,
  sections = [],
  children,
  after,
}: {
  /** Caminho da página em DOC_PAGES, ex.: "/termos". */
  path: string;
  title: string;
  lead?: string;
  sections?: DocSection[];
  /** Blocos visuais antes das seções (cards, tabelas...). */
  children?: ReactNode;
  /** Blocos visuais depois das seções. */
  after?: ReactNode;
}) {
  const doc = docPage(path);
  const showToc = sections.length > 2;

  return (
    <main id="conteudo" className="mx-auto max-w-[1280px] px-4 pt-10 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-line pb-8">
        <span className="eyebrow text-violet">{doc?.group === "legal" ? "legal" : "institucional"}</span>
        <h1 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">{title}</h1>
        {lead && <p className="max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">{lead}</p>}
        {doc && (
          <p className="text-xs font-semibold text-muted">
            Última atualização: <time dateTime={doc.updated}>{formatDate(doc.updated)}</time>
          </p>
        )}
      </header>

      <div className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-8">
          {showToc && (
            <details className="rounded-[18px] border border-line bg-card lg:hidden">
              <summary className="flex min-h-12 cursor-pointer items-center justify-between px-4 font-mono text-xs font-bold text-violet">
                Nesta página ({sections.length})
                <span aria-hidden>▾</span>
              </summary>
              <Toc sections={sections} />
            </details>
          )}

          {children}

          {sections.length > 0 && (
            <div className="article-body max-w-[720px]">
              {sections.map((s, i) => (
                <section key={s.id} aria-labelledby={s.id}>
                  <h2 id={s.id}>
                    <span aria-hidden className="mr-3 font-mono text-base text-violet">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.title}
                  </h2>
                  {s.body}
                </section>
              ))}
            </div>
          )}

          {after}
        </div>

        <aside className="hidden flex-col gap-8 lg:sticky lg:top-6 lg:flex lg:self-start">
          {showToc && (
            <nav aria-label="Nesta página">
              <p className="mb-2 eyebrow text-violet">NESTA PÁGINA</p>
              <Toc sections={sections} />
            </nav>
          )}
          <DocNav />
        </aside>
      </div>
    </main>
  );
}

function Toc({ sections }: { sections: DocSection[] }) {
  return (
    <ol className="flex flex-col border-t border-line lg:border-t-0 lg:border-l">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="flex gap-3 px-4 py-2.5 text-sm text-[#3b3456] hover:text-violet lg:py-1.5">
            <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

/** Lista de todos os documentos institucionais, com o atual destacado. */
function DocNav() {
  const groups = [
    { key: "site", label: "INSTITUCIONAL" },
    { key: "legal", label: "LEGAL" },
  ] as const;
  return (
    <nav aria-label="Documentos" className="flex flex-col gap-5 rounded-[22px] border border-line bg-card p-5">
      {groups.map((g) => (
        <div key={g.key} className="flex flex-col">
          <p className="mb-1 eyebrow text-violet">{g.label}</p>
          {DOC_PAGES.filter((d) => d.group === g.key).map((d) => (
            <NavLink
              key={d.to}
              to={d.to}
              className={({ isActive }) => cx("-mx-2 flex min-h-11 items-center justify-between rounded-lg px-2 text-sm lg:min-h-9", isActive ? "bg-violet-soft font-bold text-violet" : "text-[#3b3456] hover:text-violet")}
            >
              {d.label}
            </NavLink>
          ))}
        </div>
      ))}
      <Link to="/contato" className="flex h-11 items-center justify-center rounded-xl bg-violet text-sm font-bold text-white hover:bg-violet-deep">
        Falar com a equipe →
      </Link>
    </nav>
  );
}

/** Card de canal/atalho usado em contato, anuncie e sobre. */
export function ChannelCard({ code, title, children, href, cta }: { code: string; title: string; children: ReactNode; href: string; cta: string }) {
  const external = href.startsWith("mailto:") || href.startsWith("http");
  const cls = "group flex h-full flex-col gap-2.5 rounded-[22px] border border-line bg-card p-5 hover:border-violet";
  const inner = (
    <>
      <span className="font-mono text-xs font-bold text-violet">{code}</span>
      <span className="text-xl font-extrabold group-hover:text-violet">{title}</span>
      <span className="text-[15px] leading-relaxed text-muted">{children}</span>
      <span className="mt-auto pt-2 text-sm font-bold text-violet">{cta} →</span>
    </>
  );
  return external ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link to={href} className={cls}>
      {inner}
    </Link>
  );
}

/** Link no corpo do texto das páginas institucionais. */
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return to.startsWith("mailto:") || to.startsWith("http") ? <a href={to}>{children}</a> : <Link to={to}>{children}</Link>;
}
