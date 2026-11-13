// Peças visuais pequenas e reutilizáveis do tema "Dia e Noite".
import type { ReactNode } from "react";
import { Link } from "react-router";
import { pct, sparkPoints, trend } from "~/lib/money";

export const cx = (...c: (string | false | undefined | null)[]) => c.filter(Boolean).join(" ");

/** Marca: "moeda" violeta com o V branco + "vibecoin_". O mesmo desenho do favicon (public/favicon.svg). */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-mono text-[21px] font-bold leading-none text-moon", className)}>
      <svg aria-hidden width="30" height="30" viewBox="0 0 64 64" className="shrink-0">
        <circle cx="32" cy="32" r="32" fill="#7b5cff" />
        <circle cx="32" cy="32" r="26" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="2.5" />
        <path d="M20 21l12 23 12-23" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      vibecoin<span className="text-lime">_</span>
    </span>
  );
}

const TONE = {
  day: { up: "text-up", down: "text-down", flat: "text-muted" },
  night: { up: "text-up-night", down: "text-down-night", flat: "text-moon-muted" },
} as const;
const STROKE = {
  day: { up: "#0b7a44", down: "#c2410c", flat: "#5e5776" },
  night: { up: "#c6f432", down: "#ff9b9b", flat: "#b9aed3" },
} as const;

/** Variação colorida ("▲ 2,4%"). Cor + seta, para não depender só da cor. */
export function Change({ value, mode = "day", arrow = true, className }: { value: number; mode?: "day" | "night"; arrow?: boolean; className?: string }) {
  const t = trend(value);
  const sign = t === "up" ? "▲ " : t === "down" ? "▼ " : "";
  return (
    <span className={cx("num font-bold", TONE[mode][t], className)}>
      {/* Com seta, o sinal fica só na seta: "▼ 2,5%" (sem "+", que confundia com alta). */}
      {arrow ? `${sign}${pct(Math.abs(value)).replace(/^\+/, "")}` : pct(value)}
    </span>
  );
}

/** Minigráfico de linha (decorativo: o número ao lado diz o mesmo). */
export function Spark({
  values,
  change,
  mode = "day",
  width = 120,
  height = 32,
  className,
}: {
  values: number[];
  change: number;
  mode?: "day" | "night";
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cx("block shrink-0", className)}>
      <polyline points={sparkPoints(values, width, height)} fill="none" stroke={STROKE[mode][trend(change)]} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Cabeçalho de seção: título + ação "ver todos". */
export function SectionTitle({
  children,
  as: Tag = "h2",
  action,
  size = "lg",
  mode = "day",
}: {
  children: ReactNode;
  as?: "h1" | "h2";
  action?: { to: string; label: string };
  size?: "lg" | "xl";
  mode?: "day" | "night";
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <Tag className={cx("font-extrabold tracking-[-0.02em]", size === "xl" ? "text-4xl sm:text-5xl" : "text-[28px] sm:text-[30px]")}>{children}</Tag>
      {action && (
        <Link
          to={action.to}
          className={cx("-my-3 inline-block py-3 text-sm font-bold", mode === "night" ? "text-lime hover:text-moon" : "text-violet hover:text-violet-deep")}
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}

/** Rótulo pequeno em mono (editoria, horário). */
export function Kicker({ children, className, mode = "day" }: { children: ReactNode; className?: string; mode?: "day" | "night" }) {
  return <span className={cx("font-mono text-[11px] font-bold uppercase leading-none", mode === "night" ? "text-lime" : "text-violet", className)}>{children}</span>;
}

/** Capa: imagem real quando existir; senão, uma grade com gráfico (placeholder). */
export function Cover({
  image,
  className,
  mode = "day",
  eager,
}: {
  image?: { src: string; alt: string };
  className?: string;
  mode?: "day" | "night";
  eager?: boolean;
}) {
  return (
    <div className={cx("relative overflow-hidden", !image && (mode === "night" ? "art-night" : "art"), className)}>
      {image ? (
        <img src={image.src} alt={image.alt} loading={eager ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <svg aria-hidden viewBox="0 0 400 200" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <polyline
            points="0,170 40,160 80,165 120,130 160,140 200,100 240,110 280,70 320,80 360,40 400,30"
            fill="none"
            stroke={mode === "night" ? "#c6f432" : "#5b2ee6"}
            strokeOpacity={mode === "night" ? 0.7 : 0.45}
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}

/** Chip de filtro (editorias, moedas). */
export function Chip({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cx(
        "inline-flex min-h-11 items-center rounded-full px-4 text-sm",
        active ? "bg-ink font-bold text-white" : "border border-line-2 bg-card text-ink hover:border-violet hover:text-violet",
      )}
    >
      {children}
    </Link>
  );
}
