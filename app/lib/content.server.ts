// Camada de dados do site. Só roda no servidor (sufixo .server).
//
// Os dados vêm de uma "fonte" (repo). Fase 0: só os dados de exemplo (mock-data.ts).
// Fase 1: MySQL quando DB_NAME/DB_USER estiverem definidos, como no Respawnou.
// Aqui ficam só as regras de exibição (paginação, rótulos de data calculados no servidor).
import type { Availability } from "./availability";
import { formatDate, formatTime, normalize, timeAgo } from "./format";
import { mockRepo } from "./repo/mock.server";
import type { Repo } from "./repo/types";
import { SECTIONS, TOOLS, sectionBySlug, type SectionSlug } from "./site";
import type { Post, PostView } from "./types";

const repo = (): Repo => mockRepo;

export const postUrl = (p: Pick<Post, "section" | "slug">) => `/${p.section}/${p.slug}`;

function toView(post: Post, now = Date.now()): PostView {
  const { body: _body, ...rest } = post;
  return {
    ...rest,
    url: postUrl(post),
    kicker: post.tag ?? sectionBySlug(post.section)?.kicker ?? "Notícias",
    ago: timeAgo(post.publishedAt, now),
    dateLabel: formatDate(post.publishedAt),
    timeLabel: formatTime(post.publishedAt),
  };
}

export interface ListOptions {
  section?: SectionSlug;
  coin?: string;
  exclude?: string[];
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalPages: number;
  total: number;
}

export async function listPosts(opts: ListOptions = {}): Promise<Paginated<PostView>> {
  const { page = 1, perPage = 12, ...filter } = opts;
  const requested = Math.max(1, Math.floor(page) || 1);
  let { items, total } = await repo().findPosts(filter, (requested - 1) * perPage, perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  // Página além do fim: mostra a última.
  const current = Math.min(requested, totalPages);
  if (current !== requested) ({ items, total } = await repo().findPosts(filter, (current - 1) * perPage, perPage));
  const now = Date.now();
  return { items: items.map((p) => toView(p, now)), page: current, totalPages, total };
}

export async function getFeatured(): Promise<PostView | null> {
  const post = await repo().findFeatured();
  return post ? toView(post) : null;
}

export async function getMostRead(limit = 5, exclude: string[] = []): Promise<PostView[]> {
  const now = Date.now();
  return (await repo().findMostRead(limit, exclude)).map((p) => toView(p, now));
}

export async function getPost(section: string, slug: string, unpublished = false) {
  const post = await repo().findPost(section, slug, unpublished);
  if (!post) return null;
  return { ...toView(post), body: post.body };
}

export async function getAllPosts(limit?: number): Promise<Post[]> {
  return repo().allPosts(limit);
}

export async function searchPosts(query: string): Promise<PostView[]> {
  const terms = normalize(query).split(/\s+/).filter(Boolean).slice(0, 8);
  if (!terms.length) return [];
  const now = Date.now();
  return (await repo().searchPosts(terms, 50)).map((p) => toView(p, now));
}

export const getCoins = () => repo().coins();
export const getCoin = (slug: string) => repo().coin(slug);
export const getHistory = (slug: string) => repo().history(slug);
export const getMarket = () => repo().market();
export const getBrokers = () => repo().brokers();

/** Moedas buscadas pelo nome ou símbolo. */
export async function searchCoins(query: string) {
  const q = normalize(query.trim());
  if (!q) return [];
  return (await getCoins()).filter((c) => normalize(`${c.name} ${c.symbol}`).split(/\s+/).some((w) => w.startsWith(q)) || normalize(c.name).includes(q));
}

/** Moedas que têm histórico mensal (aparecem no simulador). */
export async function getHistories() {
  const coins = (await getCoins()).filter((c) => !c.stable);
  const all = await Promise.all(coins.map(async (c) => ({ coin: c, history: await getHistory(c.slug) })));
  return all.filter((x) => x.history.length >= 12);
}

let availabilityCache: { at: number; value: Availability } | undefined;

/** O que tem conteúdo (ver availability.ts). Cache de 5 min. */
export async function getAvailability(): Promise<Availability> {
  if (availabilityCache && Date.now() - availabilityCache.at < 5 * 60_000) return availabilityCache.value;
  const [stats, coins, histories, brokers] = await Promise.all([repo().sectionStats(), getCoins(), getHistories(), getBrokers()]);
  const sections = SECTIONS.filter((s) => s.slug === "noticias" || stats.some((x) => x.section === s.slug && x.total > 0)).map((s) => s.slug);
  const tools = TOOLS.filter((t) => {
    if (t.slug === "conversor") return coins.length > 0;
    if (t.slug === "simulador-aporte") return histories.length > 0;
    if (t.slug === "comparador-corretoras") return brokers.length > 0;
    return true; // calculadora de IR: só conta, não depende de dados
  }).map((t) => t.slug);
  const value: Availability = { sections, quotes: coins.length > 0, tools };
  availabilityCache = { at: Date.now(), value };
  return value;
}
