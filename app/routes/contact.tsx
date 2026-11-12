import { ChannelCard, StaticPage, type DocSection } from "~/components/StaticPage";
import { seo } from "~/lib/seo";
import { mailto, SITE } from "~/lib/site";

export const meta = () => seo({ title: "Contato", description: `Como falar com a equipe do ${SITE.name}: correções, imprensa, privacidade e publicidade.`, path: "/contato" });

const sections: DocSection[] = [
  {
    id: "respostas",
    title: "Prazo de resposta",
    body: <p>Respondemos em até 5 dias úteis. Pedidos sobre dados pessoais (LGPD) são respondidos em até 15 dias.</p>,
  },
  {
    id: "o-que-nao-fazemos",
    title: "O que não fazemos",
    body: (
      <ul>
        <li>não damos recomendação de investimento individual (“devo comprar X?”);</li>
        <li>não ajudamos a recuperar moedas perdidas nem intermediamos negociações;</li>
        <li>não divulgamos pré-vendas ou lançamentos de moedas em troca de pagamento.</li>
      </ul>
    ),
  },
  {
    id: "golpe",
    title: "Caiu em um golpe?",
    body: (
      <p>
        Desconfie de quem promete recuperar o dinheiro mediante pagamento: é outro golpe. Registre um boletim de ocorrência, avise a corretora usada e, se envolver
        oferta de investimento irregular, denuncie à CVM.
      </p>
    ),
  },
];

export default function Contact() {
  return (
    <StaticPage path="/contato" title="Contato" lead={`Fale com a equipe pelo e-mail ${SITE.email}. Escolha o assunto para a mensagem chegar no lugar certo.`} sections={sections}>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChannelCard code="01 / correção" title="Achei um erro" href={mailto("Correção")} cta="Enviar correção">
          Informação errada, link quebrado ou cotação estranha? Mande o endereço da página.
        </ChannelCard>
        <ChannelCard code="02 / pauta" title="Sugestão de pauta" href={mailto("Pauta")} cta="Sugerir pauta">
          Algo que deveríamos explicar ou acompanhar.
        </ChannelCard>
        <ChannelCard code="03 / lgpd" title="Privacidade" href={mailto("LGPD")} cta="Pedido de dados">
          Pedidos sobre os seus dados pessoais.
        </ChannelCard>
        <ChannelCard code="04 / comercial" title="Publicidade" href="/anuncie" cta="Ver como anunciar">
          Regras e formatos para anunciar.
        </ChannelCard>
      </div>
    </StaticPage>
  );
}
