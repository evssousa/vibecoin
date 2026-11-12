import { data } from "react-router";
import type { Route } from "./+types/quotes";
import { CoinTable } from "~/components/cards";
import { Change, SectionTitle } from "~/components/ui";
import { getCoins, getMarket } from "~/lib/content.server";
import { formatDateTime } from "~/lib/format";
import { compactBrl, price } from "~/lib/money";
import { seo } from "~/lib/seo";

export async function loader() {
  const [coins, market] = await Promise.all([getCoins(), getMarket()]);
  if (!coins.length) throw data("Sem cotações", { status: 404 });
  return { coins, market };
}

export function meta() {
  return seo({
    title: "Cotações de criptomoedas hoje em reais",
    description: "Preço do bitcoin, ethereum, solana e das principais criptomoedas em reais, com variação em 24 horas e 7 dias e valor de mercado.",
    path: "/cotacoes",
  });
}

export default function Quotes({ loaderData }: Route.ComponentProps) {
  const { coins, market } = loaderData;
  return (
    <main id="conteudo" className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 pt-10 sm:px-6">
      <div className="flex flex-col gap-4">
        <SectionTitle as="h1" size="xl">
          Cotações em reais
        </SectionTitle>
        <p className="max-w-2xl text-lg text-muted">As maiores criptomoedas por valor de mercado, com preço em reais e variação. Clique em uma moeda para ver o gráfico e as notícias.</p>
      </div>

      {market && (
        <dl className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          <Stat label="Valor de mercado total">
            {compactBrl(market.totalMarketCapBrl)} <Change value={market.change24h} className="text-sm" />
          </Stat>
          <Stat label="Dominância do bitcoin">{market.btcDominance.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</Stat>
          <Stat label="Dólar (USD/BRL)">
            R$ {price(market.usdBrl)} <Change value={market.usdBrlChange24h} className="text-sm" />
          </Stat>
          <Stat label="Medo e ganância">
            {market.fearGreed.value} <span className="text-base font-semibold text-muted">· {market.fearGreed.label}</span>
          </Stat>
        </dl>
      )}

      <CoinTable coins={coins} />
      {market && <p className="text-sm text-muted">Atualizado em {formatDateTime(market.updatedAt)}. Cotações de referência; o preço na sua corretora pode ser diferente.</p>}
    </main>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-[18px] border border-line bg-card p-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="num text-xl font-bold">{children}</dd>
    </div>
  );
}
