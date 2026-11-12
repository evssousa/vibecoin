// Preenche um banco de DESENVOLVIMENTO com os dados de exemplo (fictícios) de mock-data.ts.
// Uso: npm run db:seed-dev
// Nunca rode em produção: apaga matérias, cotações, histórico e corretoras antes de inserir.
import { MOCK_BROKERS, MOCK_COINS, MOCK_HISTORY, MOCK_MARKET, MOCK_POSTS } from "../app/lib/mock-data.ts";
import { connect } from "./db-connect.ts";

if (process.env.NODE_ENV === "production") {
  console.error("db:seed-dev não roda com NODE_ENV=production.");
  process.exit(1);
}

const conn = await connect();
const dt = (iso: string) => iso.slice(0, 19).replace("T", " ");

await conn.query("DELETE FROM posts");
await conn.query("DELETE FROM coin_history");
await conn.query("DELETE FROM brokers");
await conn.query("UPDATE coins SET price_brl = NULL, active = 0");

for (const p of MOCK_POSTS) {
  await conn.query(
    `INSERT INTO posts (section, slug, status, origin, title, excerpt, tag, coins, level, author, read_minutes, image_url, image_alt,
      body, tags, featured, views, source_name, source_url, published_at, updated_at)
     VALUES (?, ?, 'published', 'manual', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.section,
      p.slug,
      p.title,
      p.excerpt,
      p.tag ?? null,
      JSON.stringify(p.coins),
      p.level ?? null,
      p.author,
      p.readMinutes,
      p.image?.src ?? null,
      p.image?.alt ?? null,
      JSON.stringify(p.body),
      p.tags ? JSON.stringify(p.tags) : null,
      p.featured ? 1 : 0,
      p.views,
      p.source?.name ?? null,
      p.source?.url ?? null,
      dt(p.publishedAt),
      p.updatedAt ? dt(p.updatedAt) : null,
    ],
  );
}

for (const c of MOCK_COINS) {
  await conn.query(
    `INSERT INTO coins (slug, gecko_id, symbol, name, description, stable, active, market_rank, price_brl, price_usd, change_24h, change_7d,
      market_cap_brl, volume_24h_brl, spark_7d, quoted_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE description = VALUES(description), stable = VALUES(stable), active = 1, market_rank = VALUES(market_rank),
      price_brl = VALUES(price_brl), price_usd = VALUES(price_usd), change_24h = VALUES(change_24h), change_7d = VALUES(change_7d),
      market_cap_brl = VALUES(market_cap_brl), volume_24h_brl = VALUES(volume_24h_brl), spark_7d = VALUES(spark_7d), quoted_at = VALUES(quoted_at)`,
    [
      c.slug,
      `mock-${c.slug}`,
      c.symbol,
      c.name,
      c.description,
      c.stable ? 1 : 0,
      c.rank,
      c.priceBrl,
      c.priceUsd,
      c.change24h,
      c.change7d,
      c.marketCapBrl,
      c.volume24hBrl,
      JSON.stringify(c.spark7d),
      dt(c.updatedAt),
    ],
  );
}

for (const [slug, months] of Object.entries(MOCK_HISTORY)) {
  for (const m of months) {
    await conn.query("INSERT INTO coin_history (coin_id, month, price_brl) SELECT id, ?, ? FROM coins WHERE slug = ?", [m.month, m.priceBrl, slug]);
  }
}

for (const b of MOCK_BROKERS) {
  await conn.query(
    "INSERT INTO brokers (slug, name, url, maker_fee, taker_fee, pix_deposit, pix_withdraw, coins_count, features, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [b.slug, b.name, b.url, b.makerFee, b.takerFee, b.pixDeposit, b.pixWithdraw, b.coins, JSON.stringify(b.features), b.checkedAt],
  );
}

await conn.query("INSERT INTO settings (name, value) VALUES ('market', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [JSON.stringify(MOCK_MARKET)]);

console.log(`✓ ${MOCK_POSTS.length} matérias, ${MOCK_COINS.length} moedas, ${MOCK_BROKERS.length} corretoras de exemplo.`);
await conn.end();
