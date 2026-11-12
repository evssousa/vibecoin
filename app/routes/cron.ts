// Rotas dos jobs, chamadas pelo Cron Job da Hostinger:
//   GET /api/cron/cotacoes?token=...  cotações, panorama do mercado e histórico atrasado (a cada 15 min)
//   GET /api/cron/historico?token=... força o histórico mensal de todas as moedas (manual)
//   GET /api/cron/status?token=...    últimas execuções
//
// Como no Respawnou: a CDN da Hostinger corta requisições com mais de ~1 min, então os jobs
// respondem 202 na hora e rodam em segundo plano; o resultado fica em cron_runs (veja /status).
// wait=1 espera o fim (uso local). Sem CRON_TOKEN, sem banco ou com token errado: 404.
import { timingSafeEqual } from "node:crypto";
import type { Route } from "./+types/cron";
import { hasDatabase } from "~/lib/db.server";
import { historyJob, quotesJob, recentRuns, type JobResult } from "~/lib/market/jobs.server";

function authorized(request: Request) {
  const expected = process.env.CRON_TOKEN;
  if (!expected || expected.length < 24) return false;
  const url = new URL(request.url);
  const given = request.headers.get("x-cron-token") ?? url.searchParams.get("token") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const notFound = () => new Response("Not Found", { status: 404 });
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export async function loader({ request, params }: Route.LoaderArgs) {
  if (!authorized(request) || !hasDatabase()) return notFound();
  const url = new URL(request.url);

  if (params.job === "status") return Response.json(await recentRuns(Number(url.searchParams.get("n")) || 10), { headers });

  let job: () => Promise<JobResult>;
  if (params.job === "cotacoes") job = quotesJob;
  else if (params.job === "historico") job = historyJob;
  else return notFound();

  if (url.searchParams.get("wait") !== "1") {
    job().catch((err) => console.error(`[cron] ${params.job}:`, err));
    return Response.json({ status: "started", message: "Rodando em segundo plano; veja /api/cron/status." }, { status: 202, headers });
  }
  const result = await job();
  return Response.json(result, { status: result.status === "error" ? 500 : 200, headers });
}
