import type { ReactNode } from "react";
import { Link } from "react-router";
import { toolsFor, useAvailability } from "~/lib/availability";
import type { Tool } from "~/lib/site";
import { cx } from "./ui";

/** Moldura comum das ferramentas: trilha, título, painel interativo, explicação e outras ferramentas. */
export function ToolLayout({ tool, lead, children, explain }: { tool: Tool; lead: string; children: ReactNode; explain?: ReactNode }) {
  const others = toolsFor(useAvailability()).filter((t) => t.slug !== tool.slug);
  return (
    <main id="conteudo" className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 pt-8 sm:px-6">
      <nav aria-label="Você está em" className="text-sm font-semibold text-muted">
        <Link to="/ferramentas" className="-my-3 inline-block py-3 hover:text-violet">
          Ferramentas
        </Link>
        <span aria-hidden> / </span>
        {tool.short}
      </nav>

      <header className="flex max-w-3xl flex-col gap-3">
        <span className="font-mono text-xs font-bold text-violet">{tool.code}</span>
        <h1 className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">{tool.title}</h1>
        <p className="text-lg leading-relaxed text-muted">{lead}</p>
      </header>

      {children}

      {explain && <div className="article-body max-w-3xl">{explain}</div>}

      {others.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl font-extrabold tracking-[-0.02em]">Outras ferramentas</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
            {others.map((t) => (
              <Link key={t.slug} to={`/ferramentas/${t.slug}`} className="flex flex-col gap-1 rounded-[20px] border border-line bg-card p-5 hover:border-violet">
                <span className="font-mono text-xs font-bold text-violet">{t.code}</span>
                <span className="font-extrabold">{t.short}</span>
                <span className="text-sm text-muted">{t.description}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/** Painel escuro onde a ferramenta funciona (o "terminal" do tema). */
export function ToolPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("night flex flex-col gap-5 rounded-[24px] bg-night p-5 text-moon sm:p-7", className)}>{children}</section>;
}

/** Campo de formulário no painel escuro. */
export function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex min-w-0 flex-1 basis-48 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-moon-muted">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-moon-muted">{hint}</span>}
    </div>
  );
}

export const inputCls =
  "h-[52px] w-full rounded-xl border border-night-line-2 bg-night-2 px-3.5 font-mono text-lg text-moon outline-none focus:border-lime";

/** Resultado em destaque (bloco lima). */
export function Result({ label, value, note, tone = "lime" }: { label: string; value: string; note?: ReactNode; tone?: "lime" | "violet" }) {
  return (
    <div aria-live="polite" className={cx("flex flex-col gap-1 rounded-2xl p-5", tone === "lime" ? "bg-lime text-night" : "bg-violet text-white")}>
      <span className="text-sm font-bold">{label}</span>
      <span className="num text-3xl font-bold break-all sm:text-4xl">{value}</span>
      {note && <span className="text-xs font-semibold">{note}</span>}
    </div>
  );
}

/** Aviso padrão das ferramentas. */
export function ToolDisclaimer({ children }: { children?: ReactNode }) {
  return (
    <p className="text-xs leading-relaxed text-moon-muted">
      {children ?? "Simulação para fins informativos. Não é recomendação de investimento nem substitui orientação profissional."}
    </p>
  );
}
