import { data, Link } from "react-router";
import type { Route } from "./+types/tool-brokers";
import { ToolLayout } from "~/components/ToolLayout";
import { getBrokers } from "~/lib/content.server";
import { formatDate } from "~/lib/format";
import { seo } from "~/lib/seo";
import { toolBySlug } from "~/lib/site";

const tool = toolBySlug("comparador-corretoras")!;

export async function loader() {
  const brokers = await getBrokers();
  if (!brokers.length) throw data("Sem corretoras", { status: 404 });
  return { brokers };
}

export function meta() {
  return seo({
    title: "Comparador de corretoras de criptomoedas",
    description: "Taxas de negociação, custo do Pix e recursos das corretoras de cripto que operam no Brasil, lado a lado.",
    path: "/ferramentas/comparador-corretoras",
  });
}

const fee = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

export default function Brokers({ loaderData }: Route.ComponentProps) {
  const { brokers } = loaderData;
  return (
    <ToolLayout
      tool={tool}
      lead="As taxas que mais pesam no bolso, lado a lado. Os dados são conferidos no site de cada corretora; a data de conferência aparece em cada linha."
      explain={
        <>
          <h2>Como ler a tabela</h2>
          <ul>
            <li>
              <strong>Maker</strong> é a taxa quando sua ordem fica no livro esperando alguém; <strong>taker</strong>, quando você compra ou vende na hora, pelo
              preço da tela. Quem compra pelo app geralmente paga a taxa taker.
            </li>
            <li>Taxa menor não é tudo: veja também a segurança, o atendimento e se a corretora é regulada no Brasil.</li>
          </ul>
          <p>
            O Vibecoin não recebe comissão das corretoras listadas e a ordem é alfabética. Nada aqui é recomendação. Veja o guia{" "}
            <Link to="/guias/como-comprar-sua-primeira-cripto-com-seguranca">como comprar sua primeira cripto com segurança</Link>.
          </p>
        </>
      }
    >
      <div className="overflow-x-auto rounded-[20px] border border-line bg-card">
        <table className="w-full min-w-[820px] border-collapse text-[15px]">
          <caption className="sr-only">Comparação de taxas e recursos das corretoras</caption>
          <thead>
            <tr className="bg-[#f6f4fd] text-left text-xs text-muted">
              <th scope="col" className="px-5 py-3 font-semibold">
                Corretora
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Maker
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Taker
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Depósito Pix
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Saque Pix
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Moedas
              </th>
              <th scope="col" className="px-5 py-3 font-semibold">
                Recursos
              </th>
            </tr>
          </thead>
          <tbody>
            {[...brokers]
              .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
              .map((b) => (
                <tr key={b.slug} className="border-t border-line align-top">
                  <th scope="row" className="px-5 py-4 text-left">
                    <a href={b.url} target="_blank" rel="noopener nofollow" className="font-bold hover:text-violet">
                      {b.name}
                    </a>
                    <span className="mt-1 block text-xs font-normal text-muted">conferido em {formatDate(b.checkedAt)}</span>
                  </th>
                  <td className="num px-3 py-4">{fee(b.makerFee)}</td>
                  <td className="num px-3 py-4">{fee(b.takerFee)}</td>
                  <td className="px-3 py-4">{b.pixDeposit}</td>
                  <td className="px-3 py-4">{b.pixWithdraw}</td>
                  <td className="num px-3 py-4">{b.coins}</td>
                  <td className="px-5 py-4">
                    <ul className="flex flex-wrap gap-1.5">
                      {b.features.map((f) => (
                        <li key={f} className="rounded-full bg-violet-soft px-2.5 py-1 text-xs font-semibold text-violet">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </ToolLayout>
  );
}
