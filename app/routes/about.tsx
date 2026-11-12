import { ChannelCard, StaticPage, TextLink, type DocSection } from "~/components/StaticPage";
import { seo } from "~/lib/seo";
import { SITE } from "~/lib/site";

export const meta = () => seo({ title: "Sobre", description: `O que é o ${SITE.name}, o que publicamos e como trabalhamos.`, path: "/sobre" });

const sections: DocSection[] = [
  {
    id: "o-que-e",
    title: "O que é o Vibecoin",
    body: (
      <p>
        O {SITE.name} é um site brasileiro sobre criptomoedas e finanças pessoais. A ideia é simples: explicar o que acontece no mercado em português claro, com
        preços em reais e ferramentas que fazem a conta por você — sem jargão, sem promessa de lucro fácil.
      </p>
    ),
  },
  {
    id: "o-que-publicamos",
    title: "O que publicamos",
    body: (
      <ul>
        <li>
          <strong>Notícias</strong> sobre bitcoin, altcoins, mercado e regulação;
        </li>
        <li>
          <strong>Guias</strong> do básico ao avançado: comprar, guardar, declarar;
        </li>
        <li>
          <strong>Cotações</strong> das principais criptomoedas em reais;
        </li>
        <li>
          <strong>Ferramentas</strong> gratuitas: conversor, calculadora de IR, simulador de aporte e comparador de corretoras.
        </li>
      </ul>
    ),
  },
  {
    id: "como-trabalhamos",
    title: "Como trabalhamos",
    body: (
      <p>
        Usamos automação e inteligência artificial para acompanhar muitas fontes ao mesmo tempo, sempre com fontes creditadas e regras para não inventar números.
        Os detalhes estão na <TextLink to="/politica-editorial">política editorial</TextLink>. E, para deixar claro: nada aqui é recomendação de investimento —
        veja o <TextLink to="/aviso-de-risco">aviso de risco</TextLink>.
      </p>
    ),
  },
];

export default function About() {
  return (
    <StaticPage path="/sobre" title="Sobre o Vibecoin" lead="Cripto e finanças em reais, sem jargão." sections={sections}>
      <div className="grid gap-3 sm:grid-cols-3">
        <ChannelCard code="01 / cotações" title="Cotações em reais" href="/cotacoes" cta="Ver cotações">
          As maiores criptomoedas, com variação e gráfico.
        </ChannelCard>
        <ChannelCard code="02 / ferramentas" title="Ferramentas" href="/ferramentas" cta="Abrir ferramentas">
          Conversor, IR, simulador e comparador.
        </ChannelCard>
        <ChannelCard code="03 / guias" title="Aprenda do zero" href="/guias" cta="Ver guias">
          Do primeiro bitcoin à autocustódia.
        </ChannelCard>
      </div>
    </StaticPage>
  );
}
