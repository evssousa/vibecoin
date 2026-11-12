// O que tem conteúdo: editorias, cotações e ferramentas.
// Página vazia não aparece em menu, rodapé, home nem sitemap, e leva noindex (o AdSense
// reprova sites com páginas "em construção"). Calculado em content.server.ts (getAvailability)
// e entregue pelo loader da raiz. Mesma regra do Respawnou.
import { useRouteLoaderData } from "react-router";
import { SECTIONS, TOOLS, type SectionSlug, type ToolSlug } from "./site";

export interface Availability {
  sections: SectionSlug[];
  /** Há cotações (página /cotacoes e faixa do topo). */
  quotes: boolean;
  tools: ToolSlug[];
}

/** Sem dados (ex.: página de erro): mostra tudo. */
export const ALL_AVAILABLE: Availability = {
  sections: SECTIONS.map((s) => s.slug),
  quotes: true,
  tools: TOOLS.map((t) => t.slug),
};

export function useAvailability(): Availability {
  const data = useRouteLoaderData("root") as { available?: Availability } | undefined;
  return data?.available ?? ALL_AVAILABLE;
}

/** Menu principal: cotações, editorias com conteúdo e ferramentas. */
export const navFor = (a: Availability) => [
  ...(a.quotes ? [{ to: "/cotacoes", label: "Cotações" }] : []),
  ...SECTIONS.filter((s) => a.sections.includes(s.slug)).map((s) => ({ to: `/${s.slug}`, label: s.label })),
  ...(a.tools.length ? [{ to: "/ferramentas", label: "Ferramentas" }] : []),
];

export const toolsFor = (a: Availability) => TOOLS.filter((t) => a.tools.includes(t.slug));
