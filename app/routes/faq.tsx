import { Link } from "react-router";
import { StaticPage } from "~/components/StaticPage";
import { seo } from "~/lib/seo";
import { SITE } from "~/lib/site";

const FAQ: { q: string; a: string; link?: { to: string; label: string } }[] = [
  {
    q: "O Vibecoin recomenda investimentos?",
    a: "Não. O conteúdo é informativo e educativo. Não dizemos o que comprar ou vender, nem fazemos previsão de preço.",
    link: { to: "/aviso-de-risco", label: "Aviso de risco" },
  },
  {
    q: "De onde vêm as cotações?",
    a: "De provedores de dados de mercado que consolidam preços de várias corretoras. São cotações de referência: o preço na sua corretora pode ser um pouco diferente.",
    link: { to: "/cotacoes", label: "Ver cotações" },
  },
  {
    q: "A calculadora de IR substitui um contador?",
    a: "Não. Ela faz uma estimativa com as regras vigentes na data indicada na página. Em casos complexos (várias corretoras, exterior, day trade), fale com um contador.",
    link: { to: "/ferramentas/calculadora-ir", label: "Calculadora de IR" },
  },
  {
    q: "As matérias são escritas por inteligência artificial?",
    a: "Usamos automação e IA para acompanhar fontes e redigir resumos, sempre com fontes creditadas e regras para não inventar números. Os detalhes estão na política editorial.",
    link: { to: "/politica-editorial", label: "Política editorial" },
  },
  {
    q: "Vocês ganham dinheiro com as corretoras do comparador?",
    a: "Não recebemos comissão das corretoras listadas. Se isso mudar, os links serão sinalizados e a ordem continuará alfabética.",
    link: { to: "/ferramentas/comparador-corretoras", label: "Comparador de corretoras" },
  },
  {
    q: "Preciso criar conta?",
    a: "Não. Todo o conteúdo e todas as ferramentas são gratuitos e funcionam sem cadastro.",
  },
  {
    q: "Achei um erro. Como aviso?",
    a: `Escreva para ${SITE.email} com o endereço da página. Corrigimos e, quando o erro é de informação, deixamos uma nota na matéria.`,
    link: { to: "/contato", label: "Contato" },
  },
];

export const meta = () => [
  ...seo({ title: "Perguntas frequentes", description: `Dúvidas comuns sobre o ${SITE.name}: cotações, ferramentas, IA e recomendações.`, path: "/faq" }),
  {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  },
];

export default function Faq() {
  return (
    <StaticPage path="/faq" title="Perguntas frequentes" lead="As dúvidas que mais chegam, respondidas sem enrolação.">
      <div className="flex max-w-[760px] flex-col gap-3">
        {FAQ.map((f) => (
          <details key={f.q} className="group rounded-[18px] border border-line bg-card">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-lg font-bold [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden className="font-mono text-violet transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="flex flex-col gap-3 px-5 pb-5 text-[17px] leading-relaxed text-[#3b3456]">
              <p>{f.a}</p>
              {f.link && (
                <Link to={f.link.to} className="font-bold text-violet hover:text-violet-deep">
                  {f.link.label} →
                </Link>
              )}
            </div>
          </details>
        ))}
      </div>
    </StaticPage>
  );
}
