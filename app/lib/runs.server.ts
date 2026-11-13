// Registro das execuções dos jobs (tabela cron_runs), comum ao robô e às cotações.
import type { ResultSetHeader } from "mysql2";
import { db, json, query } from "./db.server";

export interface JobResult {
  status: "ok" | "error" | "skipped";
  message: string;
  stats?: Record<string, unknown>;
  /** Rascunho gerado num teste (dry): fica em cron_runs.stats.post. */
  post?: unknown;
}

async function startRun(job: string) {
  // Execução que ficou "running" por mais de 10 min foi interrompida (ex.: deploy reiniciou o app no meio).
  await db().query(
    "UPDATE cron_runs SET status = 'error', finished_at = UTC_TIMESTAMP(), message = 'Interrompida (o app reiniciou no meio da execução)' WHERE status = 'running' AND started_at < UTC_TIMESTAMP() - INTERVAL 10 MINUTE",
  );
  // Trava simples: outra execução do mesmo job há menos de 10 min ainda rodando.
  const running = await query<{ id: number }>(
    "SELECT id FROM cron_runs WHERE job = ? AND status = 'running' AND started_at > UTC_TIMESTAMP() - INTERVAL 10 MINUTE LIMIT 1",
    [job],
  );
  if (running.length) return null;
  const [res] = await db().query<ResultSetHeader>("INSERT INTO cron_runs (job, status, started_at) VALUES (?, 'running', UTC_TIMESTAMP())", [job]);
  return res.insertId;
}

/**
 * Roda um job registrando início, fim e resultado. As rotas respondem antes de o job terminar
 * (a CDN corta em ~1 min); o resultado completo fica em cron_runs para /api/cron/status e o painel.
 */
export async function runJob(job: string, fn: () => Promise<JobResult>): Promise<JobResult> {
  const id = await startRun(job);
  if (!id) return { status: "skipped", message: "Outra execução ainda está em andamento." };
  let result: JobResult;
  try {
    result = await fn();
  } catch (err) {
    result = { status: "error", message: err instanceof Error ? err.message : String(err) };
  }
  const stats = { ...result.stats, ...(result.post ? { post: result.post } : {}) };
  await db().query("UPDATE cron_runs SET status = ?, finished_at = UTC_TIMESTAMP(), message = ?, stats = ? WHERE id = ?", [
    result.status,
    result.message.slice(0, 1000),
    JSON.stringify(stats),
    id,
  ]);
  return result;
}

/** Últimas execuções (para /api/cron/status e o painel). */
export async function recentRuns(limit = 10) {
  const rows = await query<{ id: number; job: string; status: string; started_at: string; finished_at: string | null; message: string | null; stats: unknown }>(
    "SELECT id, job, status, started_at, finished_at, message, stats FROM cron_runs ORDER BY id DESC LIMIT ?",
    [limit],
  );
  return rows.map((r) => ({ ...r, stats: json<Record<string, unknown>>(r.stats, {}) }));
}
