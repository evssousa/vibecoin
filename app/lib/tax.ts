// Imposto sobre ganho de capital com criptomoedas vendidas em corretoras brasileiras (pessoa física).
//
// Regra usada (conferir antes de cada mudança de lei; ver docs/decisoes.md):
// - isenção quando o total VENDIDO no mês (todas as criptos) não passa de R$ 35.000;
// - acima disso, imposto sobre o LUCRO, com alíquotas progressivas por faixa de ganho
//   (Lei 8.981/95 art. 21, alterado pela Lei 13.259/2016): 15% até R$ 5 mi, 17,5% até R$ 10 mi,
//   20% até R$ 30 mi e 22,5% acima;
// - pagamento por DARF (código 4600) até o último dia útil do mês seguinte.
// Corretoras no exterior seguem outra regra (Lei 14.754/2023: 15% ao ano, na declaração anual).

export const EXEMPTION_LIMIT = 35_000;
export const RULES_CHECKED_AT = "2026-11-12";

const BRACKETS: [limit: number, rate: number][] = [
  [5_000_000, 0.15],
  [10_000_000, 0.175],
  [30_000_000, 0.2],
  [Infinity, 0.225],
];

export interface TaxResult {
  exempt: boolean;
  gain: number;
  tax: number;
  /** Alíquota efetiva sobre o ganho. */
  rate: number;
}

/** sold: total vendido no mês; cost: custo de aquisição do que foi vendido (preço médio × quantidade). */
export function cryptoTax(sold: number, cost: number): TaxResult {
  const gain = Math.max(0, sold - cost);
  if (sold <= EXEMPTION_LIMIT || gain === 0) return { exempt: sold <= EXEMPTION_LIMIT, gain, tax: 0, rate: 0 };
  let tax = 0;
  let floor = 0;
  for (const [limit, rate] of BRACKETS) {
    if (gain <= floor) break;
    tax += (Math.min(gain, limit) - floor) * rate;
    floor = limit;
  }
  return { exempt: false, gain, tax, rate: tax / gain };
}
