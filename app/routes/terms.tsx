import { StaticPage, TextLink, type DocSection } from "~/components/StaticPage";
import { seo } from "~/lib/seo";
import { SITE } from "~/lib/site";

export const meta = () => seo({ title: "Termos de uso", description: `Regras de uso do ${SITE.name} e do conteúdo publicado no site.`, path: "/termos" });

// Site informativo: sem vendas, sem cadastro e sem intermediação financeira.
const sections: DocSection[] = [
  {
    id: "aceitacao",
    title: "Aceitação",
    body: (
      <p>
        Ao acessar o {SITE.name} ({SITE.url.replace(/^https?:\/\//, "")}), você concorda com estes termos, com o{" "}
        <TextLink to="/aviso-de-risco">aviso de risco</TextLink> e com a nossa <TextLink to="/privacidade">política de privacidade</TextLink>. Se não concordar,
        não use o site.
      </p>
    ),
  },
  {
    id: "servico",
    title: "O serviço",
    body: (
      <p>
        O {SITE.name} é um site gratuito e apenas informativo, com notícias, guias, cotações e ferramentas sobre criptomoedas e finanças pessoais. Não somos
        corretora, banco nem consultoria: não compramos, vendemos ou guardamos ativos, e não é preciso criar conta para usar o site. Podemos mudar, suspender ou
        encerrar qualquer parte do site a qualquer momento.
      </p>
    ),
  },
  {
    id: "investimentos",
    title: "Não é recomendação de investimento",
    body: (
      <p>
        O conteúdo não é recomendação de compra ou venda de nenhum ativo. Criptomoedas são investimentos de alto risco. Leia o{" "}
        <TextLink to="/aviso-de-risco">aviso de risco</TextLink> antes de tomar qualquer decisão.
      </p>
    ),
  },
  {
    id: "propriedade",
    title: "Propriedade intelectual",
    body: (
      <>
        <p>Textos, marca, logotipo e elementos visuais criados pelo {SITE.name} são nossos e protegidos pela Lei de Direitos Autorais (Lei 9.610/1998).</p>
        <p>
          Nomes e logotipos de moedas, projetos e empresas pertencem aos seus donos e aparecem aqui com fins informativos e jornalísticos. Para pedir a remoção de
          algum material, escreva pela página de <TextLink to="/contato">contato</TextLink>.
        </p>
      </>
    ),
  },
  {
    id: "uso-permitido",
    title: "O que você pode fazer",
    body: (
      <ul>
        <li>ler, compartilhar e linkar as nossas matérias e ferramentas;</li>
        <li>citar trechos curtos, desde que com crédito ao {SITE.name} e link para a página original;</li>
        <li>assinar o nosso feed RSS em leitores de notícias para uso pessoal.</li>
      </ul>
    ),
  },
  {
    id: "uso-proibido",
    title: "O que você não pode fazer",
    body: (
      <ul>
        <li>copiar matérias inteiras ou republicá-las em outro site, perfil ou canal sem autorização por escrito;</li>
        <li>coletar conteúdo ou cotações de forma automatizada e em massa (scraping);</li>
        <li>tentar invadir, sobrecarregar ou atrapalhar o funcionamento do site;</li>
        <li>usar o nome ou a marca {SITE.name} de forma que sugira uma parceria que não existe.</li>
      </ul>
    ),
  },
  {
    id: "links",
    title: "Links externos e anúncios",
    body: (
      <>
        <p>
          Links para sites de terceiros (corretoras, projetos, fontes) são oferecidos por conveniência. Não controlamos esses sites e não respondemos pelo
          conteúdo, pelos serviços ou pelas políticas deles. Links de afiliados, se existirem, serão sinalizados.
        </p>
        <p>
          O site pode exibir anúncios do Google AdSense, escolhidos pelo Google e separados do conteúdo editorial. Anúncio não é recomendação. Como eles usam
          cookies está na <TextLink to="/cookies">política de cookies</TextLink>.
        </p>
      </>
    ),
  },
  {
    id: "informacao",
    title: "Precisão das informações",
    body: (
      <p>
        Trabalhamos para publicar informações corretas, mas preços, regras e taxas mudam o tempo todo. O conteúdo é oferecido como está, sem garantia de que esteja
        livre de erros ou atualizado. Se encontrar um erro, <TextLink to="/contato">avise a gente</TextLink>.
      </p>
    ),
  },
  {
    id: "responsabilidade",
    title: "Limitação de responsabilidade",
    body: (
      <p>
        Na medida permitida pela lei, o {SITE.name} não responde por perdas financeiras ou outros danos decorrentes de decisões tomadas com base no conteúdo do site,
        por indisponibilidade, por atraso nas cotações ou por serviços de terceiros.
      </p>
    ),
  },
  {
    id: "alteracoes",
    title: "Alterações",
    body: <p>Podemos atualizar estes termos. A data da última atualização aparece no topo da página, e mudanças importantes serão avisadas no site.</p>,
  },
  {
    id: "lei",
    title: "Lei aplicável",
    body: <p>Estes termos seguem as leis do Brasil.</p>,
  },
];

export default function Terms() {
  return <StaticPage path="/termos" title="Termos de uso" lead={`As regras para usar o ${SITE.name} e o conteúdo que publicamos, em linguagem direta.`} sections={sections} />;
}
