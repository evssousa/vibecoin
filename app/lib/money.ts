// Formatação de dinheiro e variações (pt-BR). Usado no servidor e no navegador (ferramentas).

const brl2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const brl4 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 4, maximumFractionDigits: 4 });
const usd2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd4 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 });

/** Preço em reais: centavos acima de R$ 1, quatro casas abaixo (moedas baratas). */
export const brl = (n: number) => (Math.abs(n) >= 1 || n === 0 ? brl2 : brl4).format(n).replace(/ /g, " ");
export const usd = (n: number) => (Math.abs(n) >= 1 || n === 0 ? usd2 : usd4).format(n).replace(/ /g, " ");

/** Preço sem o "R$" (tabelas e faixa de cotações). */
export const price = (n: number) => brl(n).replace(/^R\$\s?/, "");

/** Valores grandes: "R$ 10,4 tri", "R$ 780 bi", "R$ 62 mi". */
export function compactBrl(n: number) {
  const units: [number, string][] = [
    [1e12, "tri"],
    [1e9, "bi"],
    [1e6, "mi"],
    [1e3, "mil"],
  ];
  for (const [v, label] of units) {
    if (Math.abs(n) >= v) {
      const x = n / v;
      return `R$ ${x.toLocaleString("pt-BR", { maximumFractionDigits: x >= 100 ? 0 : 1 })} ${label}`;
    }
  }
  return brl(n);
}

/** "+2,4%", "−1,8%", "0,0%" (sinal de menos tipográfico). */
export function pct(n: number, digits = 1) {
  const abs = Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (Number(Math.abs(n).toFixed(digits)) === 0) return `${abs}%`;
  return `${n > 0 ? "+" : "−"}${abs}%`;
}

export type Trend = "up" | "down" | "flat";
export const trend = (n: number, digits = 1): Trend => (Number(Math.abs(n).toFixed(digits)) === 0 ? "flat" : n > 0 ? "up" : "down");

/** Lê número digitado no formato brasileiro ("1.234,56", "0,05", "1234.5"). */
export function parseNumber(input: string): number {
  const s = input.replace(/[^\d.,-]/g, "");
  if (!s) return NaN;
  // Com vírgula: ponto é milhar. Sem vírgula: ponto é decimal só se houver um e ≤ 3 casas não forem milhar.
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
  const parts = s.split(".");
  if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) return Number(s.replace(/\./g, ""));
  return Number(s);
}

/** Pontos do minigráfico (SVG viewBox 0 0 w h). */
export function sparkPoints(values: number[], w = 120, h = 32, pad = 3) {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - pad - ((v - min) / range) * (h - pad * 2)).toFixed(1)}`)
    .join(" ");
}
