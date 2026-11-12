import { StaticPage, TextLink, type DocSection } from "~/components/StaticPage";
import { seo } from "~/lib/seo";
import { SITE } from "~/lib/site";

export const meta = () =>
  seo({
    title: "Aviso de risco",
    description: `O conteúdo do ${SITE.name} é informativo e não é recomendação de investimento. Entenda os riscos das criptomoedas.`,
    path: "/aviso-de-risco",
  });

const sections: DocSection[] = [
  {
    id: "nao-e-recomendacao",
    title: "Não é recomendação de investimento",
    body: (
      <>
        <p>
          Tudo o que o {SITE.name} publica — notícias, guias, cotações e ferramentas — tem caráter <strong>informativo e educativo</strong>. Nada aqui é
          recomendação de compra, venda ou manutenção de qualquer ativo, nem consultoria de valores mobiliários.
        </p>
        <p>
          O {SITE.name} não é registrado na CVM como analista, consultor ou gestor, e não oferece serviços de investimento. Decisões de investimento são suas: se
          precisar de orientação personalizada, procure um profissional certificado.
        </p>
      </>
    ),
  },
  {
    id: "riscos",
    title: "Os riscos das criptomoedas",
    body: (
      <ul>
        <li>
          <strong>Volatilidade:</strong> os preços podem subir ou cair muito em pouco tempo. Você pode perder parte ou todo o valor investido.
        </li>
        <li>
          <strong>Golpes e fraudes:</strong> promessas de rendimento garantido, “robôs de trade” e pirâmides são comuns. Desconfie de lucro fácil.
        </li>
        <li>
          <strong>Custódia:</strong> moedas guardadas em corretoras dependem da segurança e da saúde financeira delas; em carteira própria, perder a senha ou as
          palavras de recuperação significa perder o acesso.
        </li>
        <li>
          <strong>Regulação:</strong> regras e impostos podem mudar e afetar o valor ou a forma de negociar os ativos.
        </li>
        <li>
          <strong>Liquidez:</strong> moedas pequenas podem ser difíceis de vender pelo preço que aparece na tela.
        </li>
      </ul>
    ),
  },
  {
    id: "cotacoes",
    title: "Cotações e ferramentas",
    body: (
      <p>
        As cotações exibidas são de referência, vêm de provedores de dados de mercado e podem ter atraso ou diferença em relação ao preço da sua corretora. As
        ferramentas (conversor, calculadora de IR, simulador e comparador) fazem estimativas com as regras e os dados disponíveis na data indicada em cada uma, e
        não substituem a conferência na corretora, na Receita Federal ou com um contador.
      </p>
    ),
  },
  {
    id: "desempenho",
    title: "Resultado passado não garante resultado futuro",
    body: <p>Gráficos, simulações e históricos mostram o que já aconteceu. Eles não indicam o que vai acontecer com o preço daqui para frente.</p>,
  },
  {
    id: "independencia",
    title: "Independência",
    body: (
      <p>
        O {SITE.name} não recebe para falar bem de moedas, projetos ou corretoras. Conteúdo patrocinado, se um dia existir, será marcado como tal. As regras estão
        na <TextLink to="/politica-editorial">política editorial</TextLink>.
      </p>
    ),
  },
];

export default function Risk() {
  return (
    <StaticPage
      path="/aviso-de-risco"
      title="Aviso de risco"
      lead="Informação para você decidir melhor — não uma indicação do que fazer com o seu dinheiro."
      sections={sections}
    />
  );
}
