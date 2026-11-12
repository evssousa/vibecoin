import { isRouteErrorResponse, Link, Links, Meta, Outlet, Scripts, ScrollRestoration, useLocation, useRouteLoaderData } from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { CookieConsent } from "./components/CookieConsent";
import { Footer } from "./components/Footer";
import { SiteHeader, TickerBar } from "./components/Header";
import { adsenseClient, consentBootstrap } from "./lib/ads";
import { getAvailability, getCoins, getMarket } from "./lib/content.server";
import { SITE } from "./lib/site";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "alternate", type: "application/rss+xml", title: `${SITE.name} — RSS`, href: "/rss.xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap",
  },
];

export async function loader() {
  const [available, coins, market] = await Promise.all([getAvailability(), getCoins(), getMarket()]);
  return { available, coins, market, adsClient: adsenseClient() };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  // O painel /admin (fase 3) terá o próprio cabeçalho: sem faixa de cotações, menu e rodapé do site.
  const admin = useLocation().pathname.startsWith("/admin");
  // Anúncios + banner de cookies só com ADSENSE_CLIENT configurado, e nunca no painel.
  const adsClient = admin ? null : (data?.adsClient ?? null);
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f0b1a" />
        <Meta />
        <Links />
        {adsClient && (
          <>
            <script dangerouslySetInnerHTML={{ __html: consentBootstrap() }} />
            <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsClient}`} crossOrigin="anonymous" />
          </>
        )}
      </head>
      <body className="min-h-screen">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-lime focus:px-4 focus:py-3 focus:font-bold focus:text-night">
          Pular para o conteúdo
        </a>
        {!admin && (
          <div className="night relative bg-night text-moon">
            <TickerBar coins={data?.coins ?? []} market={data?.market ?? null} />
            <SiteHeader />
          </div>
        )}
        {children}
        {!admin && <Footer adsOn={Boolean(adsClient)} />}
        {adsClient && <CookieConsent />}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  let details = notFound ? "A página que você procura não existe ou foi removida." : "Algo deu errado do nosso lado. Tente de novo em instantes.";
  let stack: string | undefined;
  if (!notFound && import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main id="conteudo" className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6">
      <title>{`${notFound ? "Página não encontrada" : "Erro"} | ${SITE.name}`}</title>
      <p className="font-mono text-sm font-bold text-violet">{notFound ? "> erro 404 · página não encontrada" : "> erro · falha no servidor"}</p>
      <h1 className="mt-4 text-5xl font-extrabold tracking-[-0.03em] sm:text-7xl">{notFound ? "Essa cotação não existe." : "Deu ruim por aqui."}</h1>
      <p className="mt-6 max-w-xl text-lg text-muted">{details}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/" className="inline-flex min-h-12 items-center rounded-xl bg-violet px-6 font-bold text-white hover:bg-violet-deep">
          Voltar para a home
        </Link>
        <Link to="/busca" className="inline-flex min-h-12 items-center rounded-xl border border-line-2 bg-card px-6 font-bold hover:border-violet hover:text-violet">
          Buscar no site
        </Link>
      </div>
      {stack && (
        <pre className="mt-10 overflow-x-auto rounded-xl border border-line bg-card p-4 text-xs text-muted">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
