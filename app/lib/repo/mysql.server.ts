// Fonte de dados MySQL (produção). Estrutura das tabelas em db/migrations/.
import { iso, json, query } from "../db.server";
import { SECTIONS, type GuideLevel, type SectionSlug } from "../site";
import type { Block, Broker, Coin, MarketOverview, MonthlyPrice, Post } from "../types";
import type { PostFilter, Repo } from "./types";

// ───────────── Linhas do banco → tipos do site ─────────────

interface PostRow {
  section: SectionSlug;
  slug: string;
  title: string;
  excerpt: string;
  tag: string | null;
  coins: unknown;
  level: number | null;
  author: string;
  read_minutes: number;
  image_url: string | null;
  image_alt: string | null;
  image_credit: string | null;
  meta_description?: string | null;
  focus_keyword?: string | null;
  tags?: unknown;
  body?: unknown;
  featured: number;
  views: number;
  source_name: string | null;
  source_url: string | null;
  published_at: string;
  updated_at: string | null;
}

function toPost(r: PostRow): Post {
  return {
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    section: r.section,
    tag: r.tag ?? undefined,
    coins: json<string[]>(r.coins, []),
    level: r.level === 1 || r.level === 2 || r.level === 3 ? (r.level as GuideLevel) : undefined,
    publishedAt: iso(r.published_at)!,
    updatedAt: iso(r.updated_at),
    author: r.author,
    readMinutes: r.read_minutes,
    image: r.image_url ? { src: r.image_url, alt: r.image_alt ?? r.title, credit: r.image_credit ?? undefined } : undefined,
    metaDescription: r.meta_description ?? undefined,
    focusKeyword: r.focus_keyword ?? undefined,
    tags: json<string[] | undefined>(r.tags, undefined),
    body: json<Block[]>(r.body, []),
    featured: Boolean(r.featured),
    views: r.views,
    source: r.source_name && r.source_url ? { name: r.source_name, url: r.source_url } : undefined,
  };
}

interface CoinRow {
  slug: string;
  symbol: string;
  name: string;
  description: string;
  stable: number;
  market_rank: number | null;
  price_brl: string;
  price_usd: string | null;
  change_24h: string | null;
  change_7d: string | null;
  market_cap_brl: string | null;
  volume_24h_brl: string | null;
  spark_7d: unknown;
  quoted_at: string | null;
}

// DECIMAL chega como texto (mysql2): converte para número.
const num = (v: string | number | null | undefined) => (v == null ? 0 : Number(v));

function toCoin(r: CoinRow, i: number): Coin {
  return {
    slug: r.slug,
    symbol: r.symbol,
    name: r.name,
    rank: r.market_rank ?? i + 1,
    priceBrl: num(r.price_brl),
    priceUsd: num(r.price_usd),
    change24h: num(r.change_24h),
    change7d: num(r.change_7d),
    marketCapBrl: num(r.market_cap_brl),
    volume24hBrl: num(r.volume_24h_brl),
    spark7d: json<number[]>(r.spark_7d, []),
    description: r.description,
    stable: Boolean(r.stable),
    updatedAt: iso(r.quoted_at) ?? new Date().toISOString(),
  };
}

// Listagens não precisam do corpo do texto: evita trafegar o JSON inteiro.
const POST_COLS = `p.section, p.slug, p.title, p.excerpt, p.tag, p.coins, p.level, p.author, p.read_minutes,
  p.image_url, p.image_alt, p.image_credit, p.featured, p.views, p.source_name, p.source_url, p.published_at, p.updated_at`;
const PUBLISHED = `p.status = 'published' AND p.published_at <= UTC_TIMESTAMP()`;
const COIN_COLS = `slug, symbol, name, description, stable, market_rank, price_brl, price_usd, change_24h, change_7d, market_cap_brl, volume_24h_brl, spark_7d, quoted_at`;
// Moeda sem cotação (antes da primeira coleta) não aparece.
const QUOTED = `active = 1 AND price_brl IS NOT NULL`;

function where(f: PostFilter) {
  const sql = [PUBLISHED];
  const params: unknown[] = [];
  if (f.section) {
    sql.push("p.section = ?");
    params.push(f.section);
  }
  if (f.coin) {
    sql.push("JSON_CONTAINS(p.coins, ?)");
    params.push(JSON.stringify(f.coin));
  }
  if (f.exclude?.length) {
    sql.push(`p.slug NOT IN (${f.exclude.map(() => "?").join(",")})`);
    params.push(...f.exclude);
  }
  return { sql: sql.join(" AND "), params };
}

const like = (t: string) => `%${t.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export const mysqlRepo: Repo = {
  async findPosts(filter, offset, limit) {
    const w = where(filter);
    const [rows, count] = await Promise.all([
      query<PostRow>(`SELECT ${POST_COLS} FROM posts p WHERE ${w.sql} ORDER BY p.published_at DESC LIMIT ? OFFSET ?`, [...w.params, limit, offset]),
      query<{ total: number }>(`SELECT COUNT(*) AS total FROM posts p WHERE ${w.sql}`, w.params),
    ]);
    return { items: rows.map(toPost), total: Number(count[0]?.total ?? 0) };
  },

  async findFeatured() {
    const rows = await query<PostRow>(`SELECT ${POST_COLS} FROM posts p WHERE ${PUBLISHED} ORDER BY p.featured DESC, p.published_at DESC LIMIT 1`);
    return rows[0] ? toPost(rows[0]) : null;
  },

  async findMostRead(limit, exclude) {
    const w = where({ exclude });
    // "Mais lidas" da última semana, para a lista não ficar parada nos mesmos posts antigos.
    const rows = await query<PostRow>(
      `SELECT ${POST_COLS} FROM posts p WHERE ${w.sql} AND p.published_at >= UTC_TIMESTAMP() - INTERVAL 7 DAY ORDER BY p.views DESC LIMIT ?`,
      [...w.params, limit],
    );
    return rows.map(toPost);
  },

  async findPost(section, slug, unpublished = false) {
    const rows = await query<PostRow & { status: string }>(
      `SELECT ${POST_COLS}, p.body, p.meta_description, p.focus_keyword, p.tags, p.status FROM posts p WHERE ${unpublished ? "1 = 1" : PUBLISHED} AND p.section = ? AND p.slug = ? LIMIT 1`,
      [section, slug],
    );
    if (!rows[0]) return null;
    const post = toPost(rows[0]);
    return unpublished ? { ...post, publishedAt: post.publishedAt ?? new Date().toISOString(), status: rows[0].status } : post;
  },

  async allPosts(limit = 50000) {
    const rows = await query<PostRow>(`SELECT ${POST_COLS} FROM posts p WHERE ${PUBLISHED} ORDER BY p.published_at DESC LIMIT ?`, [limit]);
    return rows.map(toPost);
  },

  async searchPosts(terms, limit) {
    // A collation utf8mb4_unicode_ci já ignora acentos e maiúsculas no LIKE.
    const conds = terms.map(() => "(p.title LIKE ? OR p.excerpt LIKE ? OR CAST(p.tags AS CHAR) LIKE ? OR CAST(p.body AS CHAR) LIKE ?)");
    const params = terms.flatMap((t) => [like(t), like(t), like(t), like(t)]);
    const rows = await query<PostRow>(`SELECT ${POST_COLS} FROM posts p WHERE ${PUBLISHED} AND ${conds.join(" AND ")} ORDER BY p.published_at DESC LIMIT ?`, [
      ...params,
      limit,
    ]);
    return rows.map(toPost);
  },

  async countPostsSince(isoDate) {
    const rows = await query<{ total: number }>(`SELECT COUNT(*) AS total FROM posts p WHERE ${PUBLISHED} AND p.published_at >= ?`, [
      isoDate.slice(0, 19).replace("T", " "),
    ]);
    return Number(rows[0]?.total ?? 0);
  },

  async sectionStats() {
    const rows = await query<{ section: SectionSlug; total: number; latest: string | null }>(
      `SELECT p.section, COUNT(*) AS total, MAX(p.published_at) AS latest FROM posts p WHERE ${PUBLISHED} GROUP BY p.section`,
    );
    return SECTIONS.map((s) => {
      const r = rows.find((x) => x.section === s.slug);
      return { section: s.slug, total: Number(r?.total ?? 0), latest: iso(r?.latest) ?? null };
    });
  },

  async coins() {
    const rows = await query<CoinRow>(`SELECT ${COIN_COLS} FROM coins WHERE ${QUOTED} ORDER BY market_rank IS NULL, market_rank, id`);
    return rows.map(toCoin);
  },

  async coin(slug) {
    const rows = await query<CoinRow>(`SELECT ${COIN_COLS} FROM coins WHERE ${QUOTED} AND slug = ? LIMIT 1`, [slug]);
    return rows[0] ? toCoin(rows[0], 0) : null;
  },

  async history(slug) {
    const rows = await query<{ month: string; price_brl: string }>(
      "SELECT h.month, h.price_brl FROM coin_history h JOIN coins c ON c.id = h.coin_id WHERE c.slug = ? ORDER BY h.month",
      [slug],
    );
    return rows.map((r): MonthlyPrice => ({ month: r.month, priceBrl: Number(r.price_brl) }));
  },

  async market() {
    const rows = await query<{ value: unknown }>("SELECT value FROM settings WHERE name = 'market' LIMIT 1");
    return rows[0] ? json<MarketOverview | null>(rows[0].value, null) : null;
  },

  async brokers() {
    const rows = await query<{
      slug: string;
      name: string;
      url: string;
      maker_fee: string;
      taker_fee: string;
      pix_deposit: string;
      pix_withdraw: string;
      coins_count: number;
      features: unknown;
      checked_at: string;
    }>("SELECT slug, name, url, maker_fee, taker_fee, pix_deposit, pix_withdraw, coins_count, features, checked_at FROM brokers WHERE active = 1 ORDER BY name");
    return rows.map(
      (r): Broker => ({
        slug: r.slug,
        name: r.name,
        url: r.url,
        makerFee: Number(r.maker_fee),
        takerFee: Number(r.taker_fee),
        pixDeposit: r.pix_deposit,
        pixWithdraw: r.pix_withdraw,
        coins: r.coins_count,
        features: json<string[]>(r.features, []),
        checkedAt: r.checked_at,
      }),
    );
  },
};
