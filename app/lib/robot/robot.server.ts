// Robô de postagem do Vibecoin. Chamado pelas rotas /api/cron/* (Cron Job da Hostinger) e pelo painel.
// Mesmo modelo do Respawnou (coleta a cada 30 min, publicação de hora em hora), só com notícias.
// Regras: docs/automacao.md.
import { createHash } from "node:crypto";
import type { ResultSetHeader } from "mysql2";
import { db, json, query } from "../db.server.ts";
import { runJob, type JobResult } from "../runs.server.ts";
import { diagnose, GeminiError } from "./gemini.server.ts";
import { fetchFeed, fetchText } from "./rss.server.ts";
import { extractArticleText } from "./text.ts";
import { countWords, keywords, similarity, slugify } from "./text.ts";
import { localizeImages, ROBOT_SECTIONS, writeArticle, type BuiltArticle, type CoinRef, type SourceItem } from "./writer.server.ts";

export type { JobResult };

const TZ = "America/Sao_Paulo";

// ───────────── Configurações (tabela settings) ─────────────

interface Settings {
  enabled: boolean;
  postsPerDay: number;
  sections: string[];
  minWords: number;
  /** Janela do dia (horário de Brasília) em que o robô publica. */
  startHour: number;
  endHour: number;
}

async function settings(): Promise<Settings> {
  const rows = await query<{ name: string; value: unknown }>("SELECT name, value FROM settings");
  const get = <T>(name: string, fallback: T) => json<T>(rows.find((r) => r.name === name)?.value, fallback);
  return {
    enabled: get("robot_enabled", false),
    postsPerDay: get("posts_per_day", 4),
    sections: get<string[]>("robot_sections", [...ROBOT_SECTIONS]).filter((s) => (ROBOT_SECTIONS as readonly string[]).includes(s)),
    minWords: get("robot_min_words", 350),
    startHour: get("robot_start_hour", 8),
    endHour: get("robot_end_hour", 22),
  };
}

/** Diagnóstico das fontes: pautas por situação, pontuação e motivos de descarte (7 dias). */
export async function feedStats() {
  const byStatus = await query<{ feed: string; weight: number; status: string; n: number; avg_score: number }>(
    `SELECT f.name AS feed, f.weight, fi.status, COUNT(*) AS n, ROUND(AVG(fi.score)) AS avg_score FROM feed_items fi JOIN feeds f ON f.id = fi.feed_id
     WHERE fi.created_at > UTC_TIMESTAMP() - INTERVAL 7 DAY GROUP BY f.name, f.weight, fi.status ORDER BY f.weight DESC, f.name`,
  );
  const reasons = await query<{ feed: string; reason: string; n: number }>(
    `SELECT f.name AS feed, LEFT(COALESCE(fi.reason, ''), 60) AS reason, COUNT(*) AS n FROM feed_items fi JOIN feeds f ON f.id = fi.feed_id
     WHERE fi.created_at > UTC_TIMESTAMP() - INTERVAL 7 DAY AND fi.status IN ('skipped','failed') GROUP BY f.name, LEFT(COALESCE(fi.reason, ''), 60) ORDER BY n DESC LIMIT 60`,
  );
  const posts = await query<{ source_name: string; n: number }>(
    "SELECT source_name, COUNT(*) AS n FROM posts WHERE origin = 'auto' AND published_at > UTC_TIMESTAMP() - INTERVAL 7 DAY GROUP BY source_name ORDER BY n DESC",
  );
  return { byStatus, reasons, posts };
}

/** Teste dos modelos do Gemini; o resultado fica em cron_runs.stats (job "diag"). */
export function diag(): Promise<JobResult> {
  return runJob("diag", async () => {
    if (!process.env.GEMINI_API_KEY) return { status: "error", message: "GEMINI_API_KEY não configurada no hPanel." };
    const stats = await diagnose();
    const ok = stats.tests.filter((t) => t.ok).map((t) => t.model);
    return { status: ok.length ? "ok" : "error", message: ok.length ? `Gemini respondendo: ${ok.join(", ")}` : "Nenhum modelo do Gemini respondeu", stats };
  });
}

// ───────────── Coleta ─────────────

// Assuntos que não viram matéria automática.
const SKIP_PATTERNS: [RegExp, string][] = [
  [/\bprice (prediction|forecast|analysis)\b|\btechnical analysis\b|\b(could|will|to) (hit|reach|surge to|soar to|crash to) \$|\bprice targets?\b.*\b(next|by)\b|\bchart (shows|signals)\b/i, "previsão de preço ou análise técnica"],
  [/\bsponsored\b|\bpress release\b|\bpartner content\b|\bpromoted\b|\badvertorial\b/i, "conteúdo patrocinado"],
  [/\bpre-?sale\b|\bairdrop\b|\bico\b|\bnext 100x\b|\b\d+x (gains?|potential)\b|\bbest (crypto|coins?|altcoins?|tokens?) to buy\b|\bmeme ?coins? to buy\b/i, "pré-venda, airdrop ou lista de 'moedas para comprar'"],
  [/\bpodcast\b|\bquiz\b|\bgiveaway\b|\bsweepstakes\b|\bwebinar\b/i, "podcast, quiz, sorteio ou webinar"],
  [/\bopinion\b|\bop-ed\b|\bcolumn:\b|\bi (think|believe|bought|sold)\b|\bwhy i\b/i, "texto de opinião"],
  [/\b(daily|weekly) (recap|roundup|newsletter|digest)\b|\bthe daily\b|\bmorning (brief|minute)\b|\bthis week in\b/i, "resumo/newsletter de outro veículo"],
];

const BOOST: [RegExp, number][] = [
  [/\b(approv(es|ed|al)|launch(es|ed)?|announce[sd]?|confirm(s|ed)?|reject(s|ed)?|ban(s|ned)?|sue[sd]?|lawsuit|charge[sd]?|arrest(ed)?)\b/i, 15],
  [/\b(hack(ed)?|exploit(ed)?|drain(ed)?|stolen|scam|fraud|bankrupt(cy)?|collapse[sd]?)\b/i, 12],
  [/\b(sec|cftc|fed|federal reserve|central bank|banco central|cvm|receita|regulat\w+|law|bill|tax)\b/i, 10],
  [/\b(etf|etfs|blackrock|fidelity|strategy|microstrategy|tesla|coinbase|binance|stablecoin|drex|pix)\b/i, 8],
  [/\b(bitcoin|btc|ethereum|ether|eth|solana|xrp)\b/i, 5],
  [/\b(brasil|brazil|brazilian|real|reais|selic|ipca|ibovespa)\b/i, 10],
];

function scoreItem(title: string, weight: number) {
  let score = weight * 10;
  for (const [re, pts] of BOOST) if (re.test(title)) score += pts;
  return score;
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const sqlNow = (d = new Date()) => d.toISOString().slice(0, 19).replace("T", " ");
const GEMINI_DOWN = "Gemini indisponível";

export async function collect(): Promise<JobResult> {
  const result = await collectFeeds();
  await retryAfterGeminiOutage();
  return result;
}

/**
 * O Gemini gratuito devolve 503 com frequência e a publicação só roda de hora em hora: se a última
 * publicação falhou por instabilidade há menos de 45 min, a coleta seguinte já tenta de novo
 * (mesma regra do Respawnou). publish() continua respeitando horário, limite e intervalo.
 */
async function retryAfterGeminiOutage() {
  const [last] = await query<{ status: string; message: string | null }>(
    "SELECT status, message FROM cron_runs WHERE job = 'publicar' AND started_at > UTC_TIMESTAMP() - INTERVAL 45 MINUTE ORDER BY id DESC LIMIT 1",
  );
  if (last?.status !== "error" || !last.message?.startsWith(GEMINI_DOWN)) return null;
  return publish();
}

function collectFeeds(): Promise<JobResult> {
  return runJob("coletar", async () => {
    const feeds = await query<{ id: number; name: string; url: string; weight: number }>("SELECT id, name, url, weight FROM feeds WHERE active = 1");
    const cutoff = Date.now() - 48 * 3600_000;
    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const feed of feeds) {
      try {
        const items = await fetchFeed(feed.url);
        for (const it of items) {
          if (!it.publishedAt || it.publishedAt.getTime() < cutoff || it.publishedAt.getTime() > Date.now() + 3600_000) continue;
          const skip = SKIP_PATTERNS.find(([re]) => re.test(it.title));
          const [res] = await db().query<ResultSetHeader>(
            `INSERT IGNORE INTO feed_items (feed_id, guid_hash, title, url, summary, media, published_at, status, score, reason)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              feed.id,
              hash(it.guid || it.url),
              it.title.slice(0, 400),
              it.url.slice(0, 600),
              it.summary.slice(0, 20000),
              JSON.stringify(it.media),
              sqlNow(it.publishedAt),
              skip ? "skipped" : "new",
              scoreItem(it.title, feed.weight),
              skip ? skip[1] : null,
            ],
          );
          if (res.affectedRows) skip ? skipped++ : added++;
        }
        await db().query("UPDATE feeds SET last_fetched_at = UTC_TIMESTAMP(), last_error = NULL WHERE id = ?", [feed.id]);
      } catch (err) {
        // "fetch failed" sozinho não diz nada: inclui a causa (DNS, TLS, conexão recusada...).
        const cause = err instanceof Error && err.cause instanceof Error ? ` (${(err.cause as Error & { code?: string }).code ?? ""} ${err.cause.message})` : "";
        const msg = `${err instanceof Error ? err.message : String(err)}${cause}`;
        errors.push(`${feed.name}: ${msg}`);
        await db().query("UPDATE feeds SET last_fetched_at = UTC_TIMESTAMP(), last_error = ? WHERE id = ?", [msg.slice(0, 500), feed.id]);
      }
    }

    // Itens velhos que nunca foram usados saem da fila.
    await db().query("UPDATE feed_items SET status = 'skipped', reason = 'expirou (mais de 48 h)' WHERE status = 'new' AND published_at < UTC_TIMESTAMP() - INTERVAL 48 HOUR");

    return {
      status: errors.length === feeds.length && feeds.length ? "error" : "ok",
      message: `${added} novos na fila, ${skipped} descartados${errors.length ? `; falhas: ${errors.join(" | ")}` : ""}`,
      stats: { feeds: feeds.length, added, skipped, errors: errors.length },
    };
  });
}

// ───────────── Publicação ─────────────

/** Dia de hoje no fuso de Brasília, como intervalo UTC para o banco. */
function todayRangeUTC() {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
  // Brasília é UTC-3 (sem horário de verão desde 2019).
  const start = new Date(`${ymd}T03:00:00Z`);
  return { start: sqlNow(start), hour: Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(now)) };
}

async function uniqueSlug(section: string, base: string) {
  const slug = base || "materia";
  const rows = await query<{ slug: string }>("SELECT slug FROM posts WHERE section = ? AND (slug = ? OR slug LIKE ?)", [section, slug, `${slug}-%`]);
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(slug)) return slug;
  for (let i = 2; ; i++) if (!taken.has(`${slug}-${i}`)) return `${slug}-${i}`;
}

/** Matérias do site para link interno: as que dividem palavras com o assunto vêm primeiro. */
async function relatedPosts(titles: string[], excludeId?: number) {
  const rows = await query<{ id: number; section: string; slug: string; title: string }>(
    `SELECT id, section, slug, title FROM posts WHERE status = 'published' AND published_at <= UTC_TIMESTAMP()
     AND published_at > UTC_TIMESTAMP() - INTERVAL 120 DAY ORDER BY published_at DESC LIMIT 200`,
  );
  const kw = new Set(titles.flatMap((t) => [...keywords(t)]));
  return rows
    .filter((r) => r.id !== excludeId)
    .map((r, i) => ({ r, score: [...keywords(r.title)].filter((w) => kw.has(w)).length * 10 - i / 100 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ r }) => ({ title: r.title, url: `/${r.section}/${r.slug}` }));
}

/** Moedas com página de cotação (para links internos e o campo coins). */
async function trackedCoins(): Promise<CoinRef[]> {
  return query<CoinRef>("SELECT slug, name, symbol FROM coins WHERE active = 1 AND price_brl IS NOT NULL ORDER BY market_rank IS NULL, market_rank");
}

const ITEM_COLS = `fi.id, fi.feed_id, f.name AS feed_name, fi.title, fi.url, fi.summary, fi.media, fi.published_at`;

/**
 * Fila de pautas em ordem de escolha (mesma regra do Respawnou, de 2026-11-12):
 *   + tipo de notícia (pontos da coleta) + peso da fonte ×3
 *   + 10 por outro veículo cobrindo o mesmo assunto + 8 se saiu nas últimas 6 h
 *   − 12 por matéria que a mesma fonte já rendeu nas últimas 24 h (rodízio)
 * Desde 2026-11-14, o texto disponível pesa: o servidor da Hostinger não consegue abrir a página de
 * vários sites (bloqueio), e a pauta só com o resumo do RSS (~25 palavras) era descartada.
 *   + 25 se a própria pauta, ou outra do mesmo assunto, traz o texto completo no RSS (≥ 150 palavras)
 *   − 30 se a fonte vem falhando por falta de texto (≥ 3 descartes "pouco conteúdo" e nenhuma
 *     matéria em 3 dias): ela continua útil como fonte complementar, mas raramente como principal
 */
const FULL_TEXT_WORDS = 150;

async function rankedQueue() {
  const rows = await query<SourceItem & { score: number; weight: number }>(
    `SELECT ${ITEM_COLS}, fi.score, f.weight FROM feed_items fi JOIN feeds f ON f.id = fi.feed_id
     WHERE fi.status = 'new' AND fi.published_at > UTC_TIMESTAMP() - INTERVAL 48 HOUR
     ORDER BY fi.published_at DESC LIMIT 200`,
  );
  const used = await query<{ source_name: string; n: number }>(
    "SELECT source_name, COUNT(*) AS n FROM posts WHERE origin = 'auto' AND published_at > UTC_TIMESTAMP() - INTERVAL 24 HOUR GROUP BY source_name",
  );
  const thin = await query<{ feed_id: number; thin: number; used: number }>(
    `SELECT feed_id, SUM(status IN ('skipped','failed') AND reason LIKE 'pouco conteúdo%') AS thin, SUM(status = 'used') AS used
     FROM feed_items WHERE created_at > UTC_TIMESTAMP() - INTERVAL 3 DAY GROUP BY feed_id`,
  );
  const blocked = new Set(thin.filter((t) => Number(t.thin) >= 3 && Number(t.used) === 0).map((t) => Number(t.feed_id)));
  const usedBy = new Map(used.map((u) => [u.source_name, Number(u.n)]));
  const kws = rows.map((r) => keywords(r.title));
  const full = rows.map((r) => countWords(r.summary ?? "") >= FULL_TEXT_WORDS);
  const now = Date.now();
  const ranked = rows.map((r, i) => {
    const topicBoost = Number(r.score) - Number(r.weight) * 10;
    const same = rows.map((o, j) => (j !== i && o.feed_id !== r.feed_id && similarity(kws[i], kws[j]) >= 0.5 ? j : -1)).filter((j) => j >= 0);
    const others = new Set(same.map((j) => rows[j].feed_id)).size;
    const published = String(r.published_at);
    const fresh = now - new Date(published.replace(" ", "T") + (published.includes("Z") ? "" : "Z")).getTime() < 6 * 3600_000;
    const hasText = full[i] || same.some((j) => full[j]);
    const rank =
      topicBoost +
      Number(r.weight) * 3 +
      others * 10 +
      (fresh ? 8 : 0) -
      (usedBy.get(r.feed_name) ?? 0) * 12 +
      (hasText ? 25 : 0) -
      (blocked.has(Number(r.feed_id)) && !hasText ? 30 : 0);
    return { item: r as SourceItem, rank };
  });
  return ranked.sort((a, b) => b.rank - a.rank).map((x) => x.item);
}

/** Fontes do mesmo assunto (outros veículos) entram juntas: mais contexto, texto mais original. */
function groupFor(item: SourceItem, queue: SourceItem[]) {
  const kw = keywords(item.title);
  return [item, ...queue.filter((q) => q.id !== item.id && q.feed_id !== item.feed_id && similarity(kw, keywords(q.title)) >= 0.5).slice(0, 2)];
}

export interface PublishOptions {
  /** Gera e devolve a matéria sem gravar nada (teste). */
  dry?: boolean;
  /** Ignora horário, limite diário e intervalo (não ignora robot_enabled, exceto em dry). */
  force?: boolean;
  /** Reescreve um post já publicado (mesmo endereço) com as regras atuais. */
  redoPostId?: number;
}

function geminiFailure(err: unknown): JobResult | null {
  // Limite do plano gratuito ou instabilidade: não queima a pauta; tenta de novo na próxima execução.
  if (err instanceof GeminiError && err.isRateLimit) return { status: "error", message: `Limite do Gemini atingido; nova tentativa na próxima execução. (${err.message})` };
  if (err instanceof GeminiError && err.isTransient) return { status: "error", message: `${GEMINI_DOWN}; nova tentativa na próxima coleta (até 30 min). (${err.message})` };
  return null;
}

/** Resumo do que foi gerado (para o teste dry e o registro em cron_runs). */
function summary(a: BuiltArticle, slug: string) {
  return {
    url: `/${a.section}/${slug}`,
    title: a.title,
    focusKeyword: a.focusKeyword,
    metaDescription: a.metaDescription,
    excerpt: a.excerpt,
    tags: a.tags,
    coins: a.coins,
    cover: { url: a.cover.url, size: `${a.cover.width}x${a.cover.height}`, sharpness: a.cover.sharpness },
    images: a.bodyImages.length,
    video: a.video?.youtubeId ?? null,
    words: a.words,
    model: a.model,
    attempts: a.attempts,
    fixes: a.fixes,
    sources: a.sources.map((s) => s.name),
    body: a.body,
  };
}

export function publish(opts: PublishOptions = {}): Promise<JobResult> {
  const job = opts.dry ? "publicar-teste" : opts.redoPostId ? "refazer" : "publicar";
  return runJob(job, async () => {
    if (!process.env.GEMINI_API_KEY) return { status: "skipped", message: "GEMINI_API_KEY não configurada no hPanel: o robô não escreve sem ela." };
    const cfg = await settings();
    if (opts.redoPostId) return redo(opts.redoPostId, cfg, Boolean(opts.dry));
    if (!cfg.enabled && !opts.dry) return { status: "skipped", message: "Robô desligado (Configurações do painel)." };
    if (!cfg.sections.length) return { status: "skipped", message: "Nenhuma editoria liberada para o robô (Configurações do painel)." };

    if (!opts.force && !opts.dry) {
      const { start, hour } = todayRangeUTC();
      if (hour < cfg.startHour || hour >= cfg.endHour) return { status: "skipped", message: `Fora do horário de publicação (${hour}h).` };
      const [{ total }] = await query<{ total: number }>("SELECT COUNT(*) AS total FROM posts WHERE origin = 'auto' AND published_at >= ?", [start]);
      if (Number(total) >= cfg.postsPerDay) return { status: "skipped", message: `Limite diário atingido (${total}/${cfg.postsPerDay}).` };
      // Espalha os posts pelo dia: intervalo mínimo entre publicações automáticas.
      const gapHours = Math.max(1, Math.floor((cfg.endHour - cfg.startHour) / Math.max(1, cfg.postsPerDay)));
      const recent = await query<{ id: number }>("SELECT id FROM posts WHERE origin = 'auto' AND published_at > UTC_TIMESTAMP() - INTERVAL ? HOUR LIMIT 1", [gapHours]);
      if (recent.length) return { status: "skipped", message: `Aguardando o intervalo de ${gapHours} h entre posts.` };
    }

    const recentTitles = (
      await query<{ title: string }>("SELECT title FROM posts WHERE status = 'published' AND published_at > UTC_TIMESTAMP() - INTERVAL 5 DAY ORDER BY published_at DESC LIMIT 40")
    ).map((r) => r.title);
    const coins = await trackedCoins();
    const tried: string[] = [];

    const queue = await rankedQueue();
    if (!queue.length) return { status: "skipped", message: "Fila vazia: nenhuma pauta nova.", stats: { tried } };
    // Até 3 pautas por execução: se uma for descartada, tenta a próxima.
    // Até 8 pautas por execução, mas no máximo 2 chamadas ao Gemini: descarte "barato" (sem texto ou
    // sem capa, antes do Gemini) não gasta cota, então vale tentar a próxima.
    let geminiTries = 0;
    for (const item of queue.slice(0, 8)) {
      if (geminiTries >= 2) break;
      const group = groupFor(item, queue);
      let result;
      try {
        result = await writeArticle(group, {
          sections: cfg.sections,
          minWords: cfg.minWords,
          recentTitles,
          related: await relatedPosts(group.map((g) => g.title)),
          coins,
        });
      } catch (err) {
        const fail = geminiFailure(err);
        if (fail) return { ...fail, stats: { tried } };
        throw err;
      }
      if (!result.ok) {
        tried.push(`#${item.id}: ${result.reason}`);
        if (!opts.dry) await markItems([item.id], result.status, result.reason);
        if (/^(recusada|reprovada)/.test(result.reason)) geminiTries++;
        continue;
      }
      const a = result.article;
      const slug = await uniqueSlug(a.section, slugify(a.title));
      if (opts.dry) return { status: "ok", message: `Teste: matéria gerada (${a.words} palavras), nada foi gravado.`, post: summary(a, slug), stats: { tried } };

      const postId = await insertPost(a, slug, { name: item.feed_name, url: item.url });
      await markItems([item.id], "used", null, postId);
      // O mesmo assunto em outros veículos não vira outro post.
      const groupKw = group.map((g) => keywords(g.title));
      const sameTopic = queue.filter((q) => q.id !== item.id && groupKw.some((k) => similarity(k, keywords(q.title)) >= 0.5));
      await markItems(sameTopic.map((r) => r.id), "skipped", `mesmo assunto do post #${postId}`);
      return {
        status: "ok",
        message: `Publicado: /${a.section}/${slug} (${a.words} palavras, ${a.bodyImages.length + 1} imagens${a.video ? ", vídeo" : ""}, fontes: ${a.sources.map((s) => s.name).join(", ")})`,
        stats: { postId, words: a.words, model: a.model, attempts: a.attempts, fixes: a.fixes, tried },
      };
    }
    return { status: "skipped", message: `Nenhuma pauta aproveitada nesta execução. ${tried.join(" · ")}`, stats: { tried } };
  });
}

/** Grava a matéria (imagens já baixadas para /media) e devolve o id. */
async function insertPost(a: BuiltArticle, slug: string, source: { name: string; url: string }) {
  const local = await localizeImages(a, slug);
  const [res] = await db().query<ResultSetHeader>(
    `INSERT INTO posts (section, slug, status, origin, title, excerpt, meta_description, focus_keyword, tags, coins, author, read_minutes,
       image_url, image_alt, image_credit, body, source_name, source_url, published_at)
     VALUES (?, ?, 'published', 'auto', ?, ?, ?, ?, ?, ?, 'Redação Vibecoin', ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
    [
      a.section,
      slug,
      a.title,
      a.excerpt,
      a.metaDescription,
      a.focusKeyword,
      JSON.stringify(a.tags),
      JSON.stringify(a.coins),
      a.readMinutes,
      local.cover.src,
      a.coverAlt,
      local.coverCredit,
      JSON.stringify(local.body),
      source.name,
      source.url,
    ],
  );
  return res.insertId;
}

/** Reescreve um post (mesmo endereço e data) a partir das pautas que o originaram. */
async function redo(postId: number, cfg: Settings, dry: boolean): Promise<JobResult> {
  const [post] = await query<{ id: number; section: string; slug: string }>("SELECT id, section, slug FROM posts WHERE id = ?", [postId]);
  if (!post) return { status: "error", message: `Post #${postId} não existe.` };
  const items = await query<SourceItem & { status: string }>(
    `SELECT ${ITEM_COLS}, fi.status FROM feed_items fi JOIN feeds f ON f.id = fi.feed_id
     WHERE fi.post_id = ? OR fi.reason = ? ORDER BY fi.status = 'used' DESC, fi.score DESC`,
    [postId, `mesmo assunto do post #${postId}`],
  );
  const main = items.find((i) => i.status === "used");
  if (!main) return { status: "error", message: `Post #${postId} não tem pauta de origem (não foi feito pelo robô).` };
  const group = groupFor(main, items);
  let result;
  try {
    result = await writeArticle(group, {
      sections: [post.section],
      minWords: cfg.minWords,
      recentTitles: [],
      related: await relatedPosts(group.map((g) => g.title), postId),
      coins: await trackedCoins(),
    });
  } catch (err) {
    const fail = geminiFailure(err);
    if (fail) return fail;
    throw err;
  }
  if (!result.ok) return { status: "error", message: `Não deu para refazer: ${result.reason}` };
  const a = result.article;
  if (dry) return { status: "ok", message: `Teste: post #${postId} refeito (${a.words} palavras), nada foi gravado.`, post: summary(a, post.slug) };
  const local = await localizeImages(a, post.slug);
  await db().query(
    `UPDATE posts SET title = ?, excerpt = ?, meta_description = ?, focus_keyword = ?, tags = ?, coins = ?, read_minutes = ?,
       image_url = ?, image_alt = ?, image_credit = ?, body = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?`,
    [
      a.title,
      a.excerpt,
      a.metaDescription,
      a.focusKeyword,
      JSON.stringify(a.tags),
      JSON.stringify(a.coins),
      a.readMinutes,
      local.cover.src,
      a.coverAlt,
      local.coverCredit,
      JSON.stringify(local.body),
      postId,
    ],
  );
  return {
    status: "ok",
    message: `Refeito: /${post.section}/${post.slug} (${a.words} palavras, ${a.bodyImages.length + 1} imagens${a.video ? ", vídeo" : ""})`,
    stats: { postId, words: a.words, model: a.model, attempts: a.attempts, fixes: a.fixes },
  };
}

async function markItems(ids: number[], status: "used" | "skipped" | "failed", reason: string | null, postId?: number) {
  if (!ids.length) return;
  await db().query(`UPDATE feed_items SET status = ?, reason = ?, post_id = ? WHERE id IN (${ids.map(() => "?").join(",")})`, [
    status,
    reason?.slice(0, 500) ?? null,
    postId ?? null,
    ...ids,
  ]);
}

/**
 * Diagnóstico (/api/cron/paginas, job "paginas"): para cada fonte ativa, a pauta mais recente —
 * quanto texto o RSS traz e se a página da matéria abre a partir deste servidor (e com quanto texto).
 * Feito porque, em 2026-11-13, sites que abrem do computador do dono recusavam o servidor da Hostinger.
 */
export function pagesDiag(): Promise<JobResult> {
  return runJob("paginas", async () => {
    const rows = await query<{ name: string; url: string; summary: string | null }>(
      `SELECT f.name, fi.url, fi.summary FROM feeds f JOIN feed_items fi ON fi.id = (
         SELECT id FROM feed_items WHERE feed_id = f.id ORDER BY published_at DESC LIMIT 1)
       WHERE f.active = 1 ORDER BY f.weight DESC, f.name`,
    );
    const feeds = [];
    for (const r of rows) {
      const rssWords = countWords(r.summary ?? "");
      let page: string;
      let pageWords = 0;
      try {
        pageWords = countWords(extractArticleText(await fetchText(r.url, 20000)));
        page = "ok";
      } catch (err) {
        const cause = err instanceof Error && err.cause instanceof Error ? ` ${(err.cause as Error & { code?: string }).code ?? err.cause.message}` : "";
        page = `${err instanceof Error ? err.message : String(err)}${cause}`.slice(0, 80);
      }
      const usable = rssWords >= FULL_TEXT_WORDS ? "texto completo no RSS" : pageWords >= 200 ? "página abre" : "só o resumo do RSS";
      feeds.push({ feed: r.name, rssWords, page, pageWords, usable });
    }
    const bad = feeds.filter((f) => f.usable === "só o resumo do RSS").map((f) => f.feed);
    return {
      status: "ok",
      message: bad.length ? `Sem texto utilizável no servidor: ${bad.join(", ")}` : "Todas as fontes têm texto utilizável.",
      stats: { feeds },
    };
  });
}
