// Peças visuais do painel /admin (tema "Dia e Noite": barra escura, área de trabalho clara).
import type { ReactNode } from "react";
import { Form, NavLink } from "react-router";
import { cx, Logo } from "./ui";

export const adminMeta = (title: string) => [{ title: `${title} · Painel Vibecoin` }, { name: "robots", content: "noindex, nofollow" }];

const NAV = [
  { to: "/admin", label: "Painel", end: true },
  { to: "/admin/visitas", label: "Visitas" },
  { to: "/admin/materias", label: "Matérias" },
  { to: "/admin/fila", label: "Fila" },
  { to: "/admin/fontes", label: "Fontes" },
  { to: "/admin/robo", label: "Robô" },
  { to: "/admin/config", label: "Config." },
];

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-day">
      <header className="night bg-night text-moon">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2" title="Ver o site">
            <Logo />
            <span className="rounded-md bg-night-3 px-2 py-0.5 font-mono text-[11px] font-bold text-glow">ADMIN</span>
          </a>
          <nav aria-label="Painel" className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => cx("whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold", isActive ? "bg-violet text-white" : "text-moon hover:text-glow")}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <Form method="post" action="/admin/sair" className="ml-auto flex items-center gap-3">
            <span className="hidden font-mono text-xs text-moon-muted md:inline">{email}</span>
            <button className="text-sm font-bold text-moon hover:text-down-night">Sair</button>
          </Form>
        </div>
      </header>
      <main id="conteudo" className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}

export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h1 className="text-3xl font-extrabold tracking-[-0.02em]">{children}</h1>
      {aside}
    </div>
  );
}

export function Card({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-[18px] border border-line bg-card p-4", className)}>
      {title && <h2 className="mb-3 eyebrow text-violet">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "warn" }) {
  return (
    <div className="rounded-[18px] border border-line bg-card p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className={cx("num mt-1 text-3xl font-bold", tone === "warn" ? "text-down" : "text-ink")}>{value}</p>
    </div>
  );
}

const PILL: Record<string, string> = {
  ok: "bg-[#e3f5ea] text-up",
  published: "bg-[#e3f5ea] text-up",
  used: "bg-[#e3f5ea] text-up",
  new: "bg-violet-soft text-violet",
  running: "bg-violet-soft text-violet",
  draft: "bg-violet-soft text-violet",
  skipped: "bg-line text-muted",
  archived: "bg-line text-muted",
  error: "bg-[#fde8dc] text-down",
  failed: "bg-[#fde8dc] text-down",
};

const PILL_LABEL: Record<string, string> = {
  ok: "ok",
  published: "publicada",
  used: "usada",
  new: "na fila",
  running: "rodando",
  draft: "rascunho",
  skipped: "descartada",
  archived: "arquivada",
  error: "erro",
  failed: "reprovada",
};

export function Pill({ status }: { status: string }) {
  return <span className={cx("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold", PILL[status] ?? "bg-line text-muted")}>{PILL_LABEL[status] ?? status}</span>;
}

export function Button({
  children,
  tone = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "default" | "danger" }) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-50",
        tone === "primary" && "bg-violet text-white hover:bg-violet-deep",
        tone === "default" && "border border-line-2 bg-card text-ink hover:border-violet hover:text-violet",
        tone === "danger" && "border border-down/40 bg-card text-down hover:bg-down hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputCls = "w-full rounded-xl border border-line-2 bg-card px-3 py-2 text-ink placeholder:text-muted focus:border-violet focus:outline-none";

export function Notice({ tone = "ok", children }: { tone?: "ok" | "warn"; children: ReactNode }) {
  return <div className={cx("rounded-xl border-l-4 bg-card px-4 py-3 text-sm", tone === "ok" ? "border-violet text-ink" : "border-down text-down")}>{children}</div>;
}

/** Data/hora curta no fuso de Brasília. */
export function when(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
