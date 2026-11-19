// Fonte de dados de exemplo (em memória). Usada quando não há banco configurado.
import { MOCK_BROKERS, MOCK_COINS, MOCK_HISTORY, MOCK_MARKET, MOCK_POSTS } from "../mock-data";
import { normalize } from "../format";
import { SECTIONS } from "../site";
import type { Post } from "../types";
import type { PostFilter, Repo } from "./types";

const byDateDesc = (a: Post, b: Post) => b.publishedAt.localeCompare(a.publishedAt);

const matches = (p: Post, f: PostFilter) =>
  (!f.section || p.section === f.section) && (!f.coin || p.coins.includes(f.coin)) && (!f.level || p.level === f.level) && !(f.exclude ?? []).includes(p.slug);

export const mockRepo: Repo = {
  async findPosts(filter, offset, limit) {
    const all = MOCK_POSTS.filter((p) => matches(p, filter)).sort(byDateDesc);
    return { items: all.slice(offset, offset + limit), total: all.length };
  },

  async findFeatured() {
    // Mesma regra do MySQL: marcação manual vale por 72 h; senão, a notícia mais recente (guia não entra).
    const sorted = [...MOCK_POSTS].sort(byDateDesc);
    const recent = (p: (typeof sorted)[number]) => Date.now() - new Date(p.publishedAt).getTime() < 72 * 3600_000;
    return sorted.find((p) => p.featured && recent(p)) ?? sorted.find((p) => p.section !== "guias") ?? sorted[0] ?? null;
  },

  async findMostRead(limit, exclude) {
    return MOCK_POSTS.filter((p) => !exclude.includes(p.slug))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  },

  async findPost(section, slug) {
    return MOCK_POSTS.find((p) => p.section === section && p.slug === slug) ?? null;
  },

  async allPosts(limit) {
    const sorted = [...MOCK_POSTS].sort(byDateDesc);
    return limit ? sorted.slice(0, limit) : sorted;
  },

  async searchPosts(terms, limit) {
    return MOCK_POSTS.filter((p) => {
      const coins = p.coins.map((c) => {
        const coin = MOCK_COINS.find((x) => x.slug === c);
        return coin ? `${coin.name} ${coin.symbol}` : c;
      });
      const text = normalize(
        [p.title, p.excerpt, p.tag ?? "", ...coins, ...p.body.map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : ""))].join(" "),
      );
      return terms.every((t) => text.includes(t));
    })
      .sort(byDateDesc)
      .slice(0, limit);
  },

  async countPostsSince(isoDate) {
    return MOCK_POSTS.filter((p) => p.publishedAt >= isoDate).length;
  },

  async sectionStats() {
    return SECTIONS.map((s) => {
      const posts = MOCK_POSTS.filter((p) => p.section === s.slug).sort(byDateDesc);
      return { section: s.slug, total: posts.length, latest: posts[0]?.publishedAt ?? null };
    });
  },

  async coins() {
    return [...MOCK_COINS].sort((a, b) => a.rank - b.rank);
  },
  async coin(slug) {
    return MOCK_COINS.find((c) => c.slug === slug) ?? null;
  },
  async history(slug) {
    return MOCK_HISTORY[slug] ?? [];
  },
  async market() {
    return MOCK_MARKET;
  },
  async brokers() {
    return MOCK_BROKERS;
  },
};
