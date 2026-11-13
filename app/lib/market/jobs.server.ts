// Jobs de dados de mercado, chamados pelo Cron Job da Hostinger via /api/cron/:job.
//
// cotacoes (a cada 15 min): preços, variação, valor de mercado e minigráfico das moedas (CoinGecko),
//   panorama do mercado (CoinGecko /global), medo e ganância (alternative.me) e dólar (AwesomeAPI).
//   Na mesma execução, atualiza o histórico mensal de até HISTORY_PER_RUN moedas que estejam atrasadas.
// historico: força a atualização do histórico mensal de todas as moedas (uso manual).
//
// Limites do plano gratuito da CoinGecko ("Demo"): ~30 chamadas/min e 10 mil/mês; histórico de 365 dias.
// A cada 15 min são 2 chamadas (~5.800/mês) + 1 por moeda no histórico (~20/mês).
import { json, query } from "../db.server";
import { runJob, type JobResult } from "../runs.server";
import type { MarketOverview, MonthlyPrice } from "../types";

export type { JobResult };

const GECKO = "https://api.coingecko.com/api/v3";
const HISTORY_PER_RUN = 3;
const SPARK_POINTS = 42;
const UA = "VibecoinBot/1.0 (+https://vibecoin.com.br)";

async function getJson<T>(url: string, gecko = false, attempt = 0): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", "User-Agent": UA };
  const key = process.env.COINGECKO_API_KEY?.trim();
  if (gecko && key) headers["x-cg-demo-api-key"] = key;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
  // Limite por minuto: espera o que a API pedir (até 65 s) e tenta de novo, no máximo 2 vezes.
  if (res.status === 429 && attempt < 2) {
    const wait = Math.min(65, Number(res.headers.get("retry-after")) || 30);
    await new Promise((r) => setTimeout(r, wait * 1000));
    return getJson<T>(url, gecko, attempt + 1);
  }
  if (!res.ok) throw new Error(`${new URL(url).host} respondeu ${res.status}`);
  return (await res.json()) as T;
}

const dt = (d: Date | string) => new Date(d).toISOString().slice(0, 19).replace("T", " ");

// ───────────── Cotações ─────────────

interface GeckoMarket {
  id: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h_in_currency: number | null;
  price_change_percentage_7d_in_currency: number | null;
  sparkline_in_7d?: { price: number[] };
  image: string | null;
  last_updated: string | null;
}

/**
 * A série de 7 dias da CoinGecko vem sempre em dólar, mesmo pedindo reais. Para o minigráfico
 * (só o desenho importa), reduz a ~42 pontos e converte pela razão preço em reais / último ponto.
 */
export function sparkToBrl(usd: number[], priceBrl: number): number[] {
  const clean = usd.filter((v) => Number.isFinite(v) && v > 0);
  if (clean.length < 2) return [];
  const step = Math.max(1, Math.floor(clean.length / SPARK_POINTS));
  const sampled = clean.filter((_, i) => i % step === 0);
  if (sampled[sampled.length - 1] !== clean[clean.length - 1]) sampled.push(clean[clean.length - 1]);
  const ratio = priceBrl / clean[clean.length - 1];
  return sampled.map((v) => Number((v * ratio).toPrecision(8)));
}

const FNG_LABEL: Record<string, string> = {
  "Extreme Fear": "Medo extremo",
  Fear: "Medo",
  Neutral: "Neutro",
  Greed: "Ganância",
  "Extreme Greed": "Ganância extrema",
};

async function updateQuotes(): Promise<{ updated: number; missing: number; usdBrl: number | null }> {
  const coins = await query<{ id: number; gecko_id: string }>("SELECT id, gecko_id FROM coins WHERE active = 1");
  if (!coins.length) return { updated: 0, missing: 0, usdBrl: null };
  const ids = coins.map((c) => c.gecko_id).join(",");

  const [markets, usd] = await Promise.all([
    getJson<GeckoMarket[]>(`${GECKO}/coins/markets?vs_currency=brl&ids=${ids}&sparkline=true&price_change_percentage=24h,7d&per_page=250`, true),
    getJson<GeckoMarket[]>(`${GECKO}/coins/markets?vs_currency=usd&ids=${ids}&per_page=250`, true).catch(() => [] as GeckoMarket[]),
  ]);
  const usdPrice = new Map(usd.map((m) => [m.id, m.current_price]));

  let updated = 0;
  for (const m of markets) {
    if (m.current_price == null) continue;
    const coin = coins.find((c) => c.gecko_id === m.id);
    if (!coin) continue;
    await query(
      `UPDATE coins SET market_rank = ?, price_brl = ?, price_usd = ?, change_24h = ?, change_7d = ?, market_cap_brl = ?, volume_24h_brl = ?,
        spark_7d = ?, image_url = ?, quoted_at = ? WHERE id = ?`,
      [
        m.market_cap_rank,
        m.current_price,
        usdPrice.get(m.id) ?? null,
        m.price_change_percentage_24h_in_currency ?? 0,
        m.price_change_percentage_7d_in_currency ?? 0,
        m.market_cap,
        m.total_volume,
        JSON.stringify(sparkToBrl(m.sparkline_in_7d?.price ?? [], m.current_price)),
        m.image,
        dt(m.last_updated ?? new Date()),
        coin.id,
      ],
    );
    updated++;
  }
  // Dólar implícito: preço do bitcoin em reais ÷ em dólar (reserva quando a API do dólar falha).
  const btc = markets.find((m) => m.id === "bitcoin");
  const btcUsd = usdPrice.get("bitcoin");
  const usdBrl = btc?.current_price && btcUsd ? btc.current_price / btcUsd : null;
  return { updated, missing: coins.length - updated, usdBrl };
}

/**
 * Variação do dólar em 24h sem depender da API do dólar: o site guarda um registro do valor a cada
 * coleta (settings.usd_brl_log, ~26 h) e compara com o mais próximo de 24 h atrás.
 */
async function usdChangeFromLog(current: number): Promise<number | null> {
  const row = (await query<{ value: unknown }>("SELECT value FROM settings WHERE name = 'usd_brl_log'"))[0];
  const now = Date.now();
  const log = (row ? json<{ t: number; v: number }[]>(row.value, []) : []).filter((p) => now - p.t < 26 * 3600_000);
  log.push({ t: now, v: Number(current.toFixed(4)) });
  await query("INSERT INTO settings (name, value) VALUES ('usd_brl_log', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [JSON.stringify(log)]);
  const old = log.filter((p) => now - p.t >= 23 * 3600_000).sort((a, b) => b.t - a.t)[0];
  return old ? ((current - old.v) / old.v) * 100 : null;
}

async function updateMarket(derivedUsdBrl: number | null) {
  const prev = (await query<{ value: unknown }>("SELECT value FROM settings WHERE name = 'market'"))[0];
  const previous = prev ? json<Partial<MarketOverview>>(prev.value, {}) : {};
  const errors: string[] = [];
  // Cada fonte é independente: se uma cair, mantém o último valor dela.
  const [global, fng, dollar] = await Promise.all([
    getJson<{ data: { total_market_cap: Record<string, number>; market_cap_percentage: Record<string, number>; market_cap_change_percentage_24h_usd: number } }>(
      `${GECKO}/global`,
      true,
    ).catch((e) => void errors.push(`global: ${e.message}`)),
    getJson<{ data: { value: string; value_classification: string }[] }>("https://api.alternative.me/fng/?limit=2").catch((e) => void errors.push(`fng: ${e.message}`)),
    getJson<{ USDBRL: { bid: string; pctChange: string } }>("https://economia.awesomeapi.com.br/json/last/USD-BRL").catch((e) => void errors.push(`dólar: ${e.message}`)),
  ]);

  const usdBrl = dollar ? Number(dollar.USDBRL.bid) : (derivedUsdBrl ?? previous.usdBrl ?? 0);
  const loggedChange = usdBrl ? await usdChangeFromLog(usdBrl) : null;

  const market: MarketOverview = {
    totalMarketCapBrl: global?.data.total_market_cap.brl ?? previous.totalMarketCapBrl ?? 0,
    change24h: global?.data.market_cap_change_percentage_24h_usd ?? previous.change24h ?? 0,
    btcDominance: global?.data.market_cap_percentage.btc ?? previous.btcDominance ?? 0,
    usdBrl,
    usdBrlChange24h: dollar ? Number(dollar.USDBRL.pctChange) : (loggedChange ?? previous.usdBrlChange24h ?? 0),
    fearGreed:
      fng && fng.data[0]
        ? {
            value: Number(fng.data[0].value),
            yesterday: Number(fng.data[1]?.value ?? fng.data[0].value),
            label: FNG_LABEL[fng.data[0].value_classification] ?? fng.data[0].value_classification,
          }
        : (previous.fearGreed ?? { value: 50, yesterday: 50, label: "Neutro" }),
    updatedAt: new Date().toISOString(),
  };
  await query("INSERT INTO settings (name, value) VALUES ('market', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [JSON.stringify(market)]);
  return { errors };
}

// ───────────── Histórico mensal ─────────────

/** Fechamento de cada mês = último preço diário daquele mês (o mês corrente fica de fora: ainda não fechou). */
export function monthlyCloses(prices: [number, number][], now = new Date()): MonthlyPrice[] {
  const current = now.toISOString().slice(0, 7);
  const byMonth = new Map<string, { t: number; p: number }>();
  for (const [t, p] of prices) {
    const month = new Date(t).toISOString().slice(0, 7);
    if (month === current || !(p > 0)) continue;
    const prev = byMonth.get(month);
    if (!prev || t > prev.t) byMonth.set(month, { t, p });
  }
  return [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, priceBrl: v.p }));
}

async function updateHistory(limit: number) {
  const lastMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
  // Moedas sem o fechamento do mês passado, as mais atrasadas primeiro (stablecoins não entram no simulador).
  const pending = await query<{ id: number; gecko_id: string }>(
    `SELECT c.id, c.gecko_id FROM coins c LEFT JOIN coin_history h ON h.coin_id = c.id
     WHERE c.active = 1 AND c.stable = 0 GROUP BY c.id, c.gecko_id HAVING COALESCE(MAX(h.month), '') < ? ORDER BY COALESCE(MAX(h.month), '') LIMIT ?`,
    [lastMonth, limit],
  );
  let months = 0;
  for (const [i, c] of pending.entries()) {
    // Respeita o limite por minuto (sem chave, a API pública aceita bem menos que 30/min).
    if (i > 0) await new Promise((r) => setTimeout(r, 2500));
    const data = await getJson<{ prices: [number, number][] }>(`${GECKO}/coins/${c.gecko_id}/market_chart?vs_currency=brl&days=365&interval=daily`, true);
    const closes = monthlyCloses(data.prices);
    for (const m of closes) {
      await query("INSERT INTO coin_history (coin_id, month, price_brl) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE price_brl = VALUES(price_brl)", [c.id, m.month, m.priceBrl]);
      months++;
    }
  }
  return { coins: pending.length, months };
}

export function quotesJob(): Promise<JobResult> {
  return runJob("cotacoes", async () => {
    const quotes = await updateQuotes();
    if (!quotes.updated && !quotes.missing) return { status: "skipped", message: "Nenhuma moeda ativa." };
    const market = await updateMarket(quotes.usdBrl);
    // Histórico atrasado vai em pequenas doses, para não estourar o limite por minuto da CoinGecko.
    const history = await updateHistory(HISTORY_PER_RUN).catch((e) => ({ error: String(e.message ?? e) }));
    const problems = [...market.errors, ...("error" in history ? [`histórico: ${history.error}`] : [])];
    return {
      status: "ok",
      message: `${quotes.updated} moeda(s) atualizada(s)${problems.length ? `; avisos: ${problems.join("; ")}` : ""}`,
      stats: { ...quotes, history },
    };
  });
}

export function historyJob(): Promise<JobResult> {
  return runJob("historico", async () => {
    const r = await updateHistory(100);
    return { status: "ok", message: `${r.months} fechamento(s) mensal(is) de ${r.coins} moeda(s)`, stats: r };
  });
}
