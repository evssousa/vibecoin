import { Form, Link, NavLink, useLocation } from "react-router";
import { navFor, useAvailability } from "~/lib/availability";
import { price } from "~/lib/money";
import type { Coin, MarketOverview } from "~/lib/types";
import { Change, Logo, cx } from "./ui";

/** Faixa de cotações no topo (rola na horizontal no celular). */
export function TickerBar({ coins, market }: { coins: Coin[]; market: MarketOverview | null }) {
  if (!coins.length) return null;
  return (
    <div className="border-b border-night-line">
      <ul aria-label="Cotações em reais" className="ticker mx-auto flex max-w-[1280px] gap-7 overflow-x-auto px-4 font-mono text-[13px] whitespace-nowrap sm:px-6">
        {coins
          .filter((c) => !c.stable)
          .slice(0, 8)
          .map((c) => (
            <li key={c.slug}>
              <Link to={`/cotacoes/${c.slug}`} className="inline-flex min-h-11 items-center gap-2 hover:text-glow">
                <span className="text-moon-muted">{c.symbol}</span>
                <span className="num">R$ {price(c.priceBrl)}</span>
                <Change value={c.change24h} mode="night" arrow={false} />
              </Link>
            </li>
          ))}
        {market && market.usdBrl > 0 && (
          <li className="inline-flex min-h-11 items-center gap-2">
            <span className="text-moon-muted">USD</span>
            <span className="num">R$ {price(market.usdBrl)}</span>
            <Change value={market.usdBrlChange24h} mode="night" arrow={false} />
          </li>
        )}
      </ul>
    </div>
  );
}

export function SiteHeader() {
  const nav = navFor(useAvailability());
  const { pathname } = useLocation();
  return (
    <header className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
      <Link to="/" aria-label="Vibecoin, página inicial" className="-my-2 py-2">
        <Logo />
      </Link>

      <nav aria-label="Principal" className="hidden flex-1 lg:block">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[15px] font-semibold">
          {nav.map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} className={({ isActive }) => cx("inline-flex min-h-11 items-center", isActive ? "text-glow" : "text-moon hover:text-glow")}>
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Form method="get" action="/busca" role="search" className="ml-auto hidden h-[46px] w-full max-w-[260px] items-center gap-2 rounded-xl border border-night-line-2 bg-night-2 px-3 sm:flex lg:ml-0">
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a99bff" strokeWidth="2.4" strokeLinecap="round" className="shrink-0">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
        <label htmlFor="busca-topo" className="sr-only">
          Buscar
        </label>
        <input id="busca-topo" name="q" type="search" placeholder="Buscar moeda ou notícia" className="h-full w-full bg-transparent text-sm text-moon outline-none placeholder:text-moon-muted" />
      </Form>

      {/* Menu do celular: <details> funciona sem JavaScript. key fecha ao trocar de página. */}
      <details key={pathname} className="group ml-auto lg:hidden sm:ml-0">
        <summary className="flex h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-night-line-2 px-3 text-sm font-bold text-moon [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="font-mono text-glow">
            ≡
          </span>
          Menu
        </summary>
        <div className="absolute inset-x-0 z-40 mt-3 border-y border-night-line bg-night px-4 pt-2 pb-5 shadow-2xl">
          <Form method="get" action="/busca" role="search" className="mt-2 flex h-[46px] items-center gap-2 rounded-xl border border-night-line-2 bg-night-2 px-3 sm:hidden">
            <label htmlFor="busca-menu" className="sr-only">
              Buscar
            </label>
            <input id="busca-menu" name="q" type="search" placeholder="Buscar moeda ou notícia" className="h-full w-full bg-transparent text-sm text-moon outline-none placeholder:text-moon-muted" />
          </Form>
          <ul className="mt-2 grid grid-cols-2 gap-1">
            {nav.map((n) => (
              <li key={n.to}>
                <NavLink to={n.to} className={({ isActive }) => cx("flex min-h-11 items-center rounded-lg px-3 font-semibold", isActive ? "bg-night-3 text-glow" : "text-moon")}>
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </header>
  );
}
