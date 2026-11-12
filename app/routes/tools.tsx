import type { Route } from "./+types/tools";
import { ToolCard } from "~/components/cards";
import { SectionTitle } from "~/components/ui";
import { toolsFor, useAvailability } from "~/lib/availability";
import { seo } from "~/lib/seo";

export function meta(_: Route.MetaArgs) {
  return seo({
    title: "Ferramentas gratuitas de cripto e finanças",
    description: "Conversor de criptomoedas, calculadora de imposto de renda para cripto, simulador de aporte mensal e comparador de corretoras. Grátis e sem cadastro.",
    path: "/ferramentas",
  });
}

export default function Tools() {
  const tools = toolsFor(useAvailability());
  return (
    <main id="conteudo" className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 pt-10 sm:px-6">
      <div className="flex flex-col gap-4">
        <SectionTitle as="h1" size="xl">
          Ferramentas
        </SectionTitle>
        <p className="max-w-2xl text-lg text-muted">Faça a conta antes de fazer o Pix. Grátis, em reais e sem cadastro.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {tools.map((t, i) => (
          <ToolCard key={t.slug} tool={t} index={i} />
        ))}
      </div>
    </main>
  );
}
