import { Link } from "react-router";
import { navFor, toolsFor, useAvailability } from "~/lib/availability";
import { DOC_PAGES, SITE } from "~/lib/site";
import { CookiePrefsButton } from "./CookieConsent";
import { Logo } from "./ui";

export function Footer({ adsOn }: { adsOn: boolean }) {
  const available = useAvailability();
  const groups = [
    { title: "Navegue", links: navFor(available) },
    { title: "Ferramentas", links: toolsFor(available).map((t) => ({ to: `/ferramentas/${t.slug}`, label: t.short })) },
    { title: "Institucional", links: DOC_PAGES.filter((d) => d.group === "site") },
    { title: "Legal", links: DOC_PAGES.filter((d) => d.group === "legal") },
  ];
  return (
    <footer className="night mt-20 bg-night text-moon">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex max-w-md flex-col gap-3">
            <Logo />
            <p className="text-[15px] leading-relaxed text-moon-muted">{SITE.description}</p>
          </div>
          <a
            href="/rss.xml"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-night-line-2 px-4 font-mono text-sm font-bold text-glow hover:border-glow"
          >
            RSS das matérias
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {groups
            .filter((g) => g.links.length)
            .map((g) => (
              <nav key={g.title} aria-label={g.title} className="flex flex-col gap-1">
                <h2 className="mb-1 eyebrow text-glow">{g.title.toUpperCase()}</h2>
                {g.links.map((l) => (
                  <Link key={l.to} to={l.to} className="py-1.5 text-sm text-moon-muted hover:text-moon">
                    {l.label}
                  </Link>
                ))}
              </nav>
            ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-night-line pt-6 text-sm text-moon-muted sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="font-mono">
            vibecoin_ · conteúdo informativo, não é recomendação de investimento.{" "}
            <Link to="/aviso-de-risco" className="text-moon underline decoration-glow underline-offset-4 hover:text-glow">
              Aviso de risco
            </Link>
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {adsOn && <CookiePrefsButton className="text-left hover:text-moon" />}
            <span>© {new Date().getFullYear()} {SITE.name}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
