import { StaticPage, TextLink, type DocSection } from "~/components/StaticPage";
import { seo } from "~/lib/seo";
import { mailto, SITE } from "~/lib/site";

export const meta = () => seo({ title: "Anuncie", description: `Como anunciar no ${SITE.name} e o que não aceitamos.`, path: "/anuncie" });

const sections: DocSection[] = [
  {
    id: "formatos",
    title: "Formatos",
    body: (
      <p>
        Hoje o {SITE.name} exibe anúncios do Google AdSense. Parcerias diretas (conteúdo patrocinado, apoio a ferramentas) podem ser discutidas pelo e-mail{" "}
        <TextLink to={mailto("Comercial")}>{SITE.email}</TextLink>, com o assunto “Comercial”.
      </p>
    ),
  },
  {
    id: "regras",
    title: "Regras",
    body: (
      <ul>
        <li>conteúdo patrocinado é sempre marcado como tal;</li>
        <li>patrocínio não compra posição no comparador de corretoras nem muda o texto das matérias;</li>
        <li>o anunciante não revisa nem aprova matérias antes da publicação.</li>
      </ul>
    ),
  },
  {
    id: "nao-aceitamos",
    title: "O que não aceitamos",
    body: (
      <ul>
        <li>pré-vendas, ICOs e lançamentos de tokens;</li>
        <li>promessas de rendimento garantido, “robôs de trade” e marketing multinível;</li>
        <li>empresas sem autorização para operar no Brasil quando ela é exigida.</li>
      </ul>
    ),
  },
];

export default function Advertise() {
  return <StaticPage path="/anuncie" title="Anuncie" lead="Publicidade que respeita o leitor — e o que fica de fora, sem exceção." sections={sections} />;
}
