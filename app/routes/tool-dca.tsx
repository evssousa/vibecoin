import { useMemo, useState } from "react";
import { data, Link } from "react-router";
import type { Route } from "./+types/tool-dca";
import { Field, inputCls, Result, ToolDisclaimer, ToolLayout, ToolPanel } from "~/components/ToolLayout";
import { getHistories } from "~/lib/content.server";
import { formatMonthYear } from "~/lib/format";
import { brl, parseNumber, pct } from "~/lib/money";
import { seo } from "~/lib/seo";
import { toolBySlug } from "~/lib/site";

const tool = toolBySlug("simulador-aporte")!;

export async function loader() {
  const histories = await getHistories();
  if (!histories.length) throw data("Sem histórico", { status: 404 });
  return {
    histories: histories.map((h) => ({ slug: h.coin.slug, symbol: h.coin.symbol, name: h.coin.name, priceNow: h.coin.priceBrl, history: h.history })),
  };
}

export function meta() {
  return seo({
    title: "Simulador de aporte mensal em bitcoin e cripto",
    description: "Quanto teria hoje quem investiu um valor fixo todo mês em bitcoin, ethereum ou solana? Simule com os preços históricos em reais.",
    path: "/ferramentas/simulador-aporte",
  });
}

const monthLabel = (m: string) => formatMonthYear(`${m}-15`);

export default function DcaSimulator({ loaderData }: Route.ComponentProps) {
  const { histories } = loaderData;
  const [slug, setSlug] = useState(histories[0].slug);
  const [monthly, setMonthly] = useState("100");
  const current = histories.find((h) => h.slug === slug) ?? histories[0];
  const months = current.history;
  const [start, setStart] = useState(months[Math.max(0, months.length - 37)].month);

  const sim = useMemo(() => {
    const amount = parseNumber(monthly);
    const from = months.findIndex((m) => m.month === start);
    if (!Number.isFinite(amount) || amount <= 0 || from < 0) return null;
    let qty = 0;
    let invested = 0;
    const series: { invested: number; value: number }[] = [];
    for (const m of months.slice(from)) {
      qty += amount / m.priceBrl;
      invested += amount;
      series.push({ invested, value: qty * m.priceBrl });
    }
    // "Hoje" é a cotação de agora (o histórico só tem meses fechados): último ponto do gráfico também.
    const value = qty * current.priceNow;
    series.push({ invested, value });
    return { qty, invested, value, result: (value / invested - 1) * 100, series };
  }, [monthly, start, months, current.priceNow]);

  // Gráfico: linha do valor da carteira e linha tracejada do total investido.
  const chart = useMemo(() => {
    if (!sim || sim.series.length < 2) return null;
    const max = Math.max(...sim.series.map((s) => Math.max(s.value, s.invested)));
    const pts = (key: "value" | "invested") =>
      sim.series.map((s, i) => `${((i / (sim.series.length - 1)) * 600).toFixed(1)},${(195 - (s[key] / max) * 185).toFixed(1)}`).join(" ");
    return { value: pts("value"), invested: pts("invested") };
  }, [sim]);

  return (
    <ToolLayout
      tool={tool}
      lead="Escolha a moeda, o valor por mês e desde quando. O simulador compra todo mês pelo preço daquele mês e mostra quanto a carteira valeria hoje."
      explain={
        <>
          <h2>Por que aportar todo mês</h2>
          <p>
            Comprar um valor fixo todo mês (estratégia conhecida como DCA, do inglês <em>dollar-cost averaging</em>) evita ter de acertar o melhor momento: em
            meses de preço baixo você compra mais moedas; em meses de preço alto, menos.
          </p>
          <p>
            A simulação usa o preço de fechamento de cada mês em reais e não considera taxas da corretora nem imposto. Resultado passado não garante resultado futuro.
            Leia o <Link to="/aviso-de-risco">aviso de risco</Link>.
          </p>
        </>
      }
    >
      <ToolPanel>
        <div className="flex flex-wrap gap-3">
          <Field label="Moeda" htmlFor="moeda">
            <select
              id="moeda"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                const h = histories.find((x) => x.slug === e.target.value)?.history ?? [];
                if (!h.some((m) => m.month === start) && h.length) setStart(h[0].month);
              }}
              className={inputCls}
            >
              {histories.map((h) => (
                <option key={h.slug} value={h.slug}>
                  {h.symbol} · {h.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valor por mês (R$)" htmlFor="aporte">
            <input id="aporte" inputMode="decimal" value={monthly} onChange={(e) => setMonthly(e.target.value)} className={inputCls} autoComplete="off" />
          </Field>
          <Field label="Desde" htmlFor="inicio">
            <select id="inicio" value={start} onChange={(e) => setStart(e.target.value)} className={inputCls}>
              {months.map((m) => (
                <option key={m.month} value={m.month}>
                  {monthLabel(m.month)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {sim && (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
              <Result label="Sua carteira valeria hoje" value={brl(sim.value)} note={`${pct(sim.result)} sobre o que foi investido`} />
              <div className="flex flex-col gap-1 rounded-2xl border border-night-line-2 p-5">
                <span className="text-sm font-bold text-moon-muted">Total investido</span>
                <span className="num text-3xl font-bold">{brl(sim.invested)}</span>
                <span className="num text-xs text-moon-muted">
                  {sim.qty.toLocaleString("pt-BR", { maximumFractionDigits: 6 })} {current.symbol} acumulados
                </span>
              </div>
            </div>
            {chart && (
              <figure className="flex flex-col gap-2">
                <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="h-44 w-full" role="img" aria-label="Valor da carteira comparado ao total investido, mês a mês">
                  <polyline points={chart.invested} fill="none" stroke="#b9aed3" strokeWidth="2" strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
                  <polyline points={chart.value} fill="none" stroke="#c6f432" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                </svg>
                <figcaption className="flex flex-wrap gap-4 text-xs text-moon-muted">
                  <span>
                    <span className="text-lime">━</span> valor da carteira
                  </span>
                  <span>┅ total investido</span>
                  <span>
                    {monthLabel(start)} → hoje
                  </span>
                </figcaption>
              </figure>
            )}
          </>
        )}
        <ToolDisclaimer />
      </ToolPanel>
    </ToolLayout>
  );
}
