// Títulos das páginas do painel (ESPECÍFICO DO SITE): o endereço vira o nome do conteúdo (matéria, guia, moeda).
import { VISITAS } from "./config";
import { query } from "./db";

type Item = { path: string; kind: string };

const TTL = 10 * 60_000;
const memoria = new Map<string, { t: number; v: string | null }>();

/** Títulos por endereço. O que não for achado (matéria apagada) fica de fora: o painel mostra o endereço. */
export async function titulos(itens: Item[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const agora = Date.now();
  const falta: Item[] = [];
  for (const i of itens) {
    const fixo = VISITAS.fixos[i.path];
    if (fixo) {
      out.set(i.path, fixo);
      continue;
    }
    const m = memoria.get(i.path);
    if (m && agora - m.t < TTL) {
      if (m.v) out.set(i.path, m.v);
    } else falta.push(i);
  }
  if (!falta.length) return out;

  const achados = new Map<string, string>();
  const seg = (p: string, n: number) => p.split("/")[n] ?? "";
  const unicos = <T,>(l: T[]) => [...new Set(l)].filter(Boolean);

  const posts = falta.filter((i) => i.kind === "materia" || i.kind === "guia");
  const slugsPosts = unicos(posts.map((i) => seg(i.path, 2)));
  if (slugsPosts.length) {
    const rows = await query<{ s: string; k: string; t: string }>(`SELECT section AS s, slug AS k, title AS t FROM posts WHERE slug IN (${slugsPosts.map(() => "?").join(",")})`, slugsPosts);
    for (const r of rows) achados.set(`/${r.s}/${r.k}`, r.t);
  }
  const moedas = unicos(falta.filter((i) => i.kind === "moeda").map((i) => seg(i.path, 2)));
  if (moedas.length) {
    const rows = await query<{ k: string; t: string; sym: string }>(`SELECT slug AS k, name AS t, symbol AS sym FROM coins WHERE slug IN (${moedas.map(() => "?").join(",")})`, moedas);
    for (const r of rows) achados.set(`/cotacoes/${r.k}`, `${r.t} (${r.sym})`);
  }
  for (const i of falta) {
    const v = achados.get(i.path) ?? null;
    memoria.set(i.path, { t: agora, v });
    if (v) out.set(i.path, v);
  }
  if (memoria.size > 5000) memoria.clear();
  return out;
}
