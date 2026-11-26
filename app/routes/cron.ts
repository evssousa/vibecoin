// Rotas dos jobs, chamadas pelas tarefas agendadas do Coolify (antes, Cron Jobs da Hostinger):
//   GET /api/cron/cotacoes?token=...  cotações, panorama do mercado e histórico atrasado (a cada 15 min)
//   GET /api/cron/coletar?token=...   lê os feeds e enche a fila de pautas (a cada 30 min)
//   GET /api/cron/publicar?token=...  publica 1 matéria (de hora em hora; respeita horário, limite e intervalo)
//   GET /api/cron/historico?token=... força o histórico mensal de todas as moedas (manual)
//   GET /api/cron/diag?token=...      testa os modelos do Gemini (resultado em /status)
//   GET /api/cron/paginas?token=...   testa, fonte por fonte, se a página da matéria abre do servidor
//   GET /api/cron/fontes?token=...    pautas por fonte e situação nos últimos 7 dias (diagnóstico)
//   GET /api/cron/status?token=...    últimas execuções
// Parâmetros de publicar: dry=1 (gera sem gravar), force=1 (ignora horário/limite/intervalo),
// refazer=<id do post> (reescreve um post do robô com as regras atuais, mesmo endereço).
//
// Como no Respawnou: a CDN da Hostinger corta requisições com mais de ~1 min, então os jobs
// respondem 202 na hora e rodam em segundo plano; o resultado fica em cron_runs (veja /status).
// wait=1 espera o fim (uso local). Sem CRON_TOKEN, sem banco ou com token errado: 404.
import { timingSafeEqual } from "node:crypto";
import type { Route } from "./+types/cron";
import { hasDatabase } from "~/lib/db.server";
import { historyJob, quotesJob } from "~/lib/market/jobs.server";
import { collect, diag, feedStats, pagesDiag, publish } from "~/lib/robot/robot.server";
import { recentRuns, type JobResult } from "~/lib/runs.server";

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
  const flag = (k: string) => url.searchParams.get(k) === "1";

  if (params.job === "status") return Response.json(await recentRuns(Number(url.searchParams.get("n")) || 10), { headers });
  if (params.job === "fontes") return Response.json(await feedStats(), { headers });

  let job: () => Promise<JobResult>;
  if (params.job === "cotacoes") job = quotesJob;
  else if (params.job === "historico") job = historyJob;
  else if (params.job === "coletar") job = collect;
  else if (params.job === "diag") job = diag;
  else if (params.job === "paginas") job = pagesDiag;
  else if (params.job === "publicar")
    job = () => publish({ dry: flag("dry"), force: flag("force"), redoPostId: Number(url.searchParams.get("refazer")) || undefined });
  else return notFound();

  if (!flag("wait")) {
    // runJob já captura e registra os erros; o catch é só uma rede de segurança.
    job().catch((err) => console.error(`[cron] ${params.job}:`, err));
    return Response.json({ status: "started", message: "Rodando em segundo plano; veja /api/cron/status." }, { status: 202, headers });
  }
  const result = await job();
  return Response.json(result, { status: result.status === "error" ? 500 : 200, headers });
}
