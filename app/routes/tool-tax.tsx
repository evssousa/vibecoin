import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Field, inputCls, Result, ToolDisclaimer, ToolLayout, ToolPanel } from "~/components/ToolLayout";
import { formatDate } from "~/lib/format";
import { brl, parseNumber } from "~/lib/money";
import { seo } from "~/lib/seo";
import { toolBySlug } from "~/lib/site";
import { cryptoTax, EXEMPTION_LIMIT, RULES_CHECKED_AT } from "~/lib/tax";

const tool = toolBySlug("calculadora-ir")!;

export function meta() {
  return seo({
    title: "Calculadora de imposto de renda para criptomoedas",
    description: "Descubra se a sua venda de cripto no mês é isenta e quanto pagar de imposto sobre o lucro, com as alíquotas da Receita Federal. Grátis.",
    path: "/ferramentas/calculadora-ir",
  });
}

const pctFmt = (n: number) => `${(n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

export default function TaxCalculator() {
  const [sold, setSold] = useState("48.000");
  const [cost, setCost] = useState("30.000");

  const result = useMemo(() => {
    const s = parseNumber(sold);
    const c = parseNumber(cost);
    if (!Number.isFinite(s) || !Number.isFinite(c) || s < 0 || c < 0) return null;
    return cryptoTax(s, c);
  }, [sold, cost]);

  let label = "Imposto a pagar";
  let value = "—";
  let note: string | undefined;
  if (result) {
    if (result.exempt) {
      label = "Isento neste mês";
      value = brl(0);
      note = `Você vendeu até ${brl(EXEMPTION_LIMIT)} no mês: o lucro é isento (mas a operação ainda é declarada no IR anual).`;
    } else if (result.gain === 0) {
      label = "Sem lucro, sem imposto";
      value = brl(0);
      note = "Vendeu pelo mesmo valor ou com prejuízo: não há imposto sobre ganho de capital.";
    } else {
      value = brl(result.tax);
      note = `Lucro de ${brl(result.gain)} · alíquota ${pctFmt(result.rate)} · DARF código 4600 até o último dia útil do mês seguinte.`;
    }
  }

  return (
    <ToolLayout
      tool={tool}
      lead="Informe quanto você vendeu de cripto no mês e quanto tinha pago por essas moedas. A calculadora diz se é isento e quanto vai no DARF."
      explain={
        <>
          <h2>Como o imposto sobre cripto funciona</h2>
          <ul>
            <li>
              <strong>Isenção:</strong> se o total vendido no mês, somando todas as criptomoedas, não passar de {brl(EXEMPTION_LIMIT)}, o lucro é isento.
            </li>
            <li>
              <strong>Acima disso:</strong> o imposto é sobre o lucro (valor de venda menos o custo de compra), com alíquota de 15% para ganhos de até R$ 5 milhões,
              subindo até 22,5% nas faixas maiores.
            </li>
            <li>
              <strong>Pagamento:</strong> por DARF, código 4600, até o último dia útil do mês seguinte à venda.
            </li>
            <li>
              <strong>Corretora no exterior:</strong> segue outra regra (15% ao ano sobre o rendimento, apurado na declaração anual). Esta calculadora é para corretoras
              brasileiras.
            </li>
          </ul>
          <p>
            Regras conferidas em {formatDate(RULES_CHECKED_AT)}. A lei muda: em caso de dúvida, fale com um contador. Veja também o guia{" "}
            <Link to="/grana/cripto-no-imposto-de-renda-passo-a-passo">cripto no Imposto de Renda, passo a passo</Link>.
          </p>
        </>
      }
    >
      <ToolPanel>
        <div className="flex flex-wrap gap-3">
          <Field label="Total vendido no mês (R$)" htmlFor="vendido" hint="Some todas as vendas de cripto do mês, em corretoras brasileiras.">
            <input id="vendido" inputMode="decimal" value={sold} onChange={(e) => setSold(e.target.value)} className={inputCls} autoComplete="off" />
          </Field>
          <Field label="Custo de compra do que foi vendido (R$)" htmlFor="custo" hint="Preço médio de compra × quantidade vendida.">
            <input id="custo" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} className={inputCls} autoComplete="off" />
          </Field>
        </div>
        <Result label={label} value={value} note={note} tone={result && !result.exempt && result.tax > 0 ? "violet" : "lime"} />
        <ToolDisclaimer>Estimativa para fins informativos, com as regras vigentes na data indicada abaixo. Não substitui um contador.</ToolDisclaimer>
      </ToolPanel>
    </ToolLayout>
  );
}
