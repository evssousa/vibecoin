// Configuração do contador de visitas ESPECÍFICA DO SITE (Vibecoin). Ao copiar o módulo para outro site, este arquivo,
// `db.ts`, `site.server.ts` e `ui/visitas.css` são os que mudam. Dados puros: nada de banco aqui.
import type { TipoPagina } from "./core/caminho";

/** Editorias com matérias (/<editoria>/<slug>), menos guias. Manter em sincronia com SECTION_SLUGS de app/routes.ts. */
const EDITORIAS = "noticias|bitcoin|altcoins|mercado|grana|regulacao";

export const VISITAS = {
  site: "Vibecoin",
  /** Endereço do painel (os links de período e filtro apontam para ele). */
  painel: "/admin/visitas",
  /** Referrer destes endereços conta como navegação interna. */
  hosts: ["vibecoin.com.br", "www.vibecoin.com.br", "localhost"],
  /** Cookie da sessão do admin: quando presente, a visita não é contada. */
  cookieAdmin: "__vibecoin_admin",
  /** Quantos dias guardar páginas e origens (os totais por dia ficam sem prazo). */
  retencaoDias: 400,
  /** A ordem importa: o primeiro tipo que bate vence. */
  tipos: [
    { tipo: "inicio", rotulo: "Página inicial", re: /^\/$/ },
    { tipo: "guia", rotulo: "Guia", re: /^\/guias\/[^/]+$/ },
    { tipo: "materia", rotulo: "Matéria", re: new RegExp(`^/(${EDITORIAS})/[^/]+$`) },
    { tipo: "moeda", rotulo: "Cotação", re: /^\/cotacoes\/[^/]+$/ },
    { tipo: "ferramenta", rotulo: "Ferramenta", re: /^\/ferramentas(\/[^/]+)?$/ },
    { tipo: "lista", rotulo: "Lista", re: new RegExp(`^/(${EDITORIAS}|guias|cotacoes|busca)$`) },
  ] as TipoPagina[],
  /** Abas do "Páginas mais vistas". `tipos: null` = todos. */
  filtros: [
    { id: "tudo", rotulo: "Tudo", tipos: null },
    { id: "materias", rotulo: "Matérias", tipos: ["materia"] },
    { id: "guias", rotulo: "Guias", tipos: ["guia"] },
    { id: "cotacoes", rotulo: "Cotações", tipos: ["moeda"] },
    { id: "ferramentas", rotulo: "Ferramentas", tipos: ["ferramenta"] },
    { id: "outras", rotulo: "Outras", tipos: ["inicio", "lista", "outra"] },
  ] as { id: string; rotulo: string; tipos: string[] | null }[],
  /** Contadores por matéria: o endereço bate com `re` e o `sql` soma as visitas (primeiro parâmetro = quantidade). */
  contadores: [
    {
      re: new RegExp(`^/(${EDITORIAS}|guias)/([^/]+)$`),
      sql: "UPDATE posts SET views = views + ? WHERE section = ? AND slug = ? AND status = 'published'",
      args: (m: RegExpMatchArray) => [m[1], m[2]],
    },
  ],
  /** Títulos fixos das páginas que não são de um conteúdo. */
  fixos: {
    "/": "Página inicial",
    "/noticias": "Notícias",
    "/bitcoin": "Bitcoin",
    "/altcoins": "Altcoins",
    "/mercado": "Mercado",
    "/grana": "Grana",
    "/regulacao": "Regulação",
    "/guias": "Guias",
    "/cotacoes": "Cotações",
    "/ferramentas": "Ferramentas",
    "/ferramentas/conversor": "Conversor de moedas",
    "/ferramentas/calculadora-ir": "Calculadora de IR sobre cripto",
    "/ferramentas/simulador-aporte": "Simulador de aporte",
    "/ferramentas/comparador-corretoras": "Comparador de corretoras",
    "/busca": "Busca",
    "/sobre": "Sobre",
    "/contato": "Contato",
    "/faq": "Perguntas frequentes",
    "/anuncie": "Anuncie",
    "/politica-editorial": "Política editorial",
    "/aviso-de-risco": "Aviso de risco",
    "/termos": "Termos de uso",
    "/privacidade": "Privacidade",
    "/cookies": "Cookies",
    "/acessibilidade": "Acessibilidade",
    "/mapa-do-site": "Mapa do site",
  } as Record<string, string>,
};

export type ConfigVisitas = typeof VISITAS;
