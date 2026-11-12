import { StaticPage, TextLink, type DocSection } from "~/components/StaticPage";
import { seo } from "~/lib/seo";
import { SITE } from "~/lib/site";

export const meta = () =>
  seo({ title: "Política editorial", description: `Como o ${SITE.name} escolhe fontes, usa automação, trata rumores e corrige erros.`, path: "/politica-editorial" });

const PRINCIPLES = [
  { n: "01", title: "Precisão", text: "Informação checada vale mais do que ser o primeiro a publicar." },
  { n: "02", title: "Sem promessas", text: "Não fazemos previsão de preço nem prometemos lucro. Nunca." },
  { n: "03", title: "Transparência", text: "Fonte creditada, patrocínio sinalizado e erro corrigido à vista." },
];

const sections: DocSection[] = [
  {
    id: "fontes",
    title: "Fontes",
    body: (
      <>
        <p>Nossas matérias se baseiam, nesta ordem de preferência, em:</p>
        <ol>
          <li>fontes oficiais: Banco Central, CVM, Receita Federal, comunicados de empresas e dos próprios projetos;</li>
          <li>imprensa especializada reconhecida, no Brasil e no exterior;</li>
          <li>provedores públicos de dados de mercado, para preços, volumes e valor de mercado.</li>
        </ol>
        <p>Quando uma matéria se baseia em outra publicação, a fonte original aparece creditada, com link.</p>
      </>
    ),
  },
  {
    id: "automacao",
    title: "Automação e inteligência artificial",
    body: (
      <>
        <p>
          Para cobrir o mercado todo dia, o {SITE.name} usa ferramentas automatizadas e de inteligência artificial para monitorar fontes, resumir notícias e
          traduzir informações. Essas ferramentas seguem regras fixas:
        </p>
        <ul>
          <li>só trabalham a partir de fontes identificadas, que são sempre creditadas;</li>
          <li>não inventam declarações, números, preços ou datas que não estejam na fonte;</li>
          <li>não fazem previsão de preço nem recomendam comprar ou vender qualquer ativo.</li>
        </ul>
        <p>Matérias produzidas com apoio de automação podem conter erros. Se encontrar um, use o canal de correções abaixo.</p>
      </>
    ),
  },
  {
    id: "rumores",
    title: "Rumores e especulação",
    body: (
      <p>
        Rumores só são publicados quando vêm de fontes com histórico de acerto e sempre identificados como <strong>rumor</strong>. Opiniões de analistas aparecem
        atribuídas a quem as deu, nunca como fato.
      </p>
    ),
  },
  {
    id: "golpes",
    title: "Projetos suspeitos",
    body: (
      <p>
        Não divulgamos lançamentos de moedas, pré-vendas ou “oportunidades” sem informação verificável. Quando um projeto tem sinais de golpe, a matéria diz isso
        com todas as letras.
      </p>
    ),
  },
  {
    id: "patrocinio",
    title: "Patrocínio e afiliados",
    body: (
      <p>
        Conteúdo pago, se existir, é marcado como <strong>patrocinado</strong> no topo da página. Links de afiliados são sinalizados e nunca mudam a ordem ou o
        conteúdo do comparador de corretoras. Mais detalhes em <TextLink to="/anuncie">anuncie</TextLink>.
      </p>
    ),
  },
  {
    id: "correcoes",
    title: "Correções",
    body: (
      <>
        <ul>
          <li>erros de digitação e de formatação são corrigidos sem aviso;</li>
          <li>erros de informação são corrigidos com uma nota no fim da matéria, com a data e o que mudou;</li>
          <li>se a matéria inteira estiver errada, ela ganha um aviso no topo em vez de ser apagada.</li>
        </ul>
        <p>
          Viu algo errado? <TextLink to="/contato">Fale com a gente</TextLink>.
        </p>
      </>
    ),
  },
  {
    id: "resposta",
    title: "Direito de resposta",
    body: (
      <p>
        Pessoas e empresas citadas numa matéria podem pedir para incluir o seu lado da história pelo e-mail {SITE.email}. Respostas relevantes são publicadas na
        própria matéria.
      </p>
    ),
  },
];

export default function Editorial() {
  return (
    <StaticPage path="/politica-editorial" title="Política editorial" lead="As regras que seguimos para escolher fontes, usar automação, tratar rumores e corrigir erros." sections={sections}>
      <ul className="grid gap-3 sm:grid-cols-3" aria-label="Princípios">
        {PRINCIPLES.map((p) => (
          <li key={p.n} className="flex flex-col gap-2 rounded-[22px] border border-line bg-card p-5">
            <span className="font-mono text-3xl font-bold text-violet">{p.n}</span>
            <span className="text-xl font-extrabold">{p.title}</span>
            <span className="text-[15px] leading-relaxed text-muted">{p.text}</span>
          </li>
        ))}
      </ul>
    </StaticPage>
  );
}
