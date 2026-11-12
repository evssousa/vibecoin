import { StaticPage, TextLink, type DocSection } from "~/components/StaticPage";
import { seo } from "~/lib/seo";
import { mailto, SITE } from "~/lib/site";

export const meta = () => seo({ title: "Acessibilidade", description: `O que o ${SITE.name} faz para ser acessível e como relatar problemas.`, path: "/acessibilidade" });

const sections: DocSection[] = [
  {
    id: "compromisso",
    title: "Nosso compromisso",
    body: <p>Queremos que todo mundo consiga ler o {SITE.name} e usar as ferramentas, com qualquer dispositivo e com tecnologias assistivas.</p>,
  },
  {
    id: "o-que-fazemos",
    title: "O que já fazemos",
    body: (
      <ul>
        <li>contraste de cores conferido nos fundos claro e escuro;</li>
        <li>alta e queda indicadas por seta (▲ ▼) e sinal, não só pela cor;</li>
        <li>navegação completa pelo teclado, com foco visível e link para pular direto ao conteúdo;</li>
        <li>campos das ferramentas com rótulos e resultados anunciados para leitores de tela;</li>
        <li>layout que funciona de celulares pequenos a telas grandes e respeita a preferência por menos animação.</li>
      </ul>
    ),
  },
  {
    id: "relatar",
    title: "Encontrou uma barreira?",
    body: (
      <p>
        Escreva para <TextLink to={mailto("Acessibilidade")}>{SITE.email}</TextLink> contando a página e o problema. Tratamos esses relatos como prioridade.
      </p>
    ),
  },
];

export default function Accessibility() {
  return <StaticPage path="/acessibilidade" title="Acessibilidade" lead="Informação financeira tem que ser para todo mundo." sections={sections} />;
}
