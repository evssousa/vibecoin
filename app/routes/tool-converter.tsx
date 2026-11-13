import { useMemo, useState } from "react";
import { data, Link } from "react-router";
import type { Route } from "./+types/tool-converter";
import { Field, inputCls, Result, ToolDisclaimer, ToolLayout, ToolPanel } from "~/components/ToolLayout";
import { getCoins } from "~/lib/content.server";
import { formatDateTime } from "~/lib/format";
import { brl, parseNumber } from "~/lib/money";
import { seo } from "~/lib/seo";
import { toolBySlug } from "~/lib/site";

const tool = toolBySlug("conversor")!;

export async function loader({ request }: Route.LoaderArgs) {
  const coins = await getCoins();
  if (!coins.length) throw data("Sem cotações", { status: 404 });
  const wanted = new URL(request.url).searchParams.get("moeda");
  const initial = coins.find((c) => c.slug === wanted)?.slug ?? coins[0].slug;
  // Só o necessário para a conta (a lista completa de dados fica no servidor).
  return { coins: coins.map((c) => ({ slug: c.slug, symbol: c.symbol, name: c.name, priceBrl: c.priceBrl, updatedAt: c.updatedAt })), initial };
}

export function meta() {
  return seo({
    title: "Conversor de criptomoedas para reais",
    description: "Converta bitcoin, ethereum, solana e outras criptomoedas para reais (e reais para cripto) com a cotação do momento. Grátis e sem cadastro.",
    path: "/ferramentas/conversor",
  });
}

const fmtQty = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: n >= 1 ? 6 : 8 });

export default function Converter({ loaderData }: Route.ComponentProps) {
  const { coins, initial } = loaderData;
  const [slug, setSlug] = useState(initial);
  const [amount, setAmount] = useState("1");
  const [toCrypto, setToCrypto] = useState(false);
  const coin = coins.find((c) => c.slug === slug) ?? coins[0];

  const result = useMemo(() => {
    const n = parseNumber(amount);
    if (!Number.isFinite(n) || n < 0) return null;
    return toCrypto ? `${fmtQty(n / coin.priceBrl)} ${coin.symbol}` : brl(n * coin.priceBrl);
  }, [amount, coin, toCrypto]);

  return (
    <ToolLayout
      tool={tool}
      lead="Quanto vale a sua cripto em reais — ou quanto de cripto dá para comprar com um valor em reais."
      explain={
        <>
          <h2>Como a conversão é feita</h2>
          <p>
            Usamos a cotação de referência do momento (média de várias corretoras, em reais). O preço que você paga na sua corretora pode ser um pouco diferente
            por causa do spread e das taxas de negociação.
          </p>
          <p>
            Quer saber quanto pagaria de imposto ao vender? Use a <Link to="/ferramentas/calculadora-ir">calculadora de IR</Link>.
          </p>
        </>
      }
    >
      <ToolPanel>
        <div className="flex flex-wrap gap-3">
          <Field label={toCrypto ? "Valor em reais" : `Quantidade de ${coin.symbol}`} htmlFor="valor">
            <input id="valor" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} autoComplete="off" />
          </Field>
          <Field label="Moeda" htmlFor="moeda">
            <select id="moeda" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls}>
              {coins.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.symbol} · {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <button
          type="button"
          onClick={() => setToCrypto((v) => !v)}
          className="min-h-11 w-fit rounded-xl border border-night-line-2 px-4 text-sm font-bold hover:border-glow hover:text-glow"
        >
          ⇅ Inverter: {toCrypto ? `${coin.symbol} → reais` : `reais → ${coin.symbol}`}
        </button>
        <Result
          label="Equivale a"
          value={result ?? "—"}
          note={`1 ${coin.symbol} = ${brl(coin.priceBrl)} · atualizado em ${formatDateTime(coin.updatedAt)}`}
        />
        <ToolDisclaimer>Cotação de referência, para fins informativos. Não é oferta de compra ou venda.</ToolDisclaimer>
      </ToolPanel>
    </ToolLayout>
  );
}
