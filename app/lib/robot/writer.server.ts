// Redator do robô: junta as fontes e a mídia, pede a matéria ao Gemini, confere qualidade e SEO
// (refazendo com a lista de problemas) e monta o corpo final com imagens, vídeo e links.
// Mesmo fluxo do Respawnou; o guia editorial é o de cripto e finanças (sem recomendação, sem previsão).
import type { Block } from "../types.ts";
import { json } from "../db.server.ts";
import { assembleBody, stripLinks } from "./assemble.ts";
import { generateJson } from "./gemini.server.ts";
import { emptyMedia, mergeMedia, type SourceMedia } from "./media.ts";
import { chooseMedia, storeImage, type ProbedImage } from "./media.server.ts";
import { autoFix, checkDraft, sanitizeLinks, type DraftArticle, type DraftBlock } from "./quality.ts";
import { fetchArticle } from "./rss.server.ts";
import { countWords } from "./text.ts";

/** Editorias que o robô pode escrever (guias são feitos à mão no painel). */
export const ROBOT_SECTIONS = ["noticias", "bitcoin", "altcoins", "mercado", "grana", "regulacao"] as const;
const MAX_ATTEMPTS = 3;

export interface SourceItem {
  id: number;
  feed_id: number;
  feed_name: string;
  title: string;
  url: string;
  summary: string | null;
  published_at: string;
  media: unknown;
}

export interface Source {
  name: string;
  title: string;
  url: string;
  date: string;
  text: string;
}

export interface CoinRef {
  slug: string;
  name: string;
  symbol: string;
}

interface GeminiDraft extends DraftArticle {
  publish: boolean;
  reason: string;
  section: string;
  coins: string[];
  tags: string[];
}

export interface BuiltArticle {
  section: string;
  title: string;
  excerpt: string;
  metaDescription: string;
  focusKeyword: string;
  tags: string[];
  coins: string[];
  body: Block[];
  words: number;
  readMinutes: number;
  cover: ProbedImage;
  coverAlt: string;
  bodyImages: ProbedImage[];
  video?: { youtubeId: string; title: string };
  sources: { name: string; url: string }[];
  model: string;
  attempts: number;
  fixes: string[];
}

export type WriteResult = { ok: true; article: BuiltArticle } | { ok: false; status: "skipped" | "failed"; reason: string };

export interface WriteContext {
  sections: string[];
  minWords: number;
  recentTitles: string[];
  /** Matérias do site para link interno (as mais parecidas primeiro). */
  related: { title: string; url: string }[];
  /** Moedas acompanhadas pelo site (página /cotacoes/<slug>). */
  coins: CoinRef[];
}

// ───────────── Prompt ─────────────

function schemaFor(coins: CoinRef[]) {
  return {
    type: "OBJECT",
    properties: {
      publish: { type: "BOOLEAN", description: "false se a pauta não serve (ver regras)" },
      reason: { type: "STRING", description: "por que publicar ou não, em uma frase" },
      section: { type: "STRING", enum: [...ROBOT_SECTIONS] },
      focusKeyword: { type: "STRING", description: "nome próprio central (moeda, empresa, órgão, pessoa ou evento), nunca termo genérico" },
      title: { type: "STRING", description: "30 a 70 caracteres, contém a focusKeyword, de preferência no começo" },
      titleAlternatives: { type: "ARRAY", items: { type: "STRING" }, description: "2 títulos alternativos com as mesmas regras" },
      metaDescription: { type: "STRING", description: "120 a 160 caracteres, com a focusKeyword, resume o fato para o Google" },
      excerpt: { type: "STRING", description: "linha fina: 1 a 2 frases, 140 a 220 caracteres, complementa o título" },
      tags: { type: "ARRAY", items: { type: "STRING" }, description: "3 a 6 tags: moedas, empresas, órgãos, temas" },
      coins: {
        type: "ARRAY",
        items: { type: "STRING", enum: coins.length ? coins.map((c) => c.slug) : ["bitcoin"] },
        description: "moedas que são assunto da matéria (só as da lista), da mais importante para a menos",
      },
      body: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING", enum: ["p", "h2", "h3", "ul", "quote"] },
            text: { type: "STRING" },
            items: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["type"],
        },
      },
    },
    required: ["publish", "reason", "section", "focusKeyword", "title", "titleAlternatives", "metaDescription", "excerpt", "tags", "coins", "body"],
  };
}

const SYSTEM = `Você é redator do Vibecoin, site brasileiro de notícias de criptomoedas e finanças pessoais. Escreve matérias completas, originais e otimizadas para o Google, em português do Brasil, para um leitor comum — não para especialistas.

VOZ E TOM
- Português brasileiro claro e direto, "cripto e finanças sem jargão": explique termos técnicos na primeira vez que aparecem (ex.: "ETF, um fundo negociado em bolsa").
- Frases de tamanho variado. Parágrafos curtos (2 a 4 frases, no máximo ~80 palavras).
- No máximo uma exclamação no texto todo. Sem emojis.
- NUNCA use: "Em um mundo onde", "Vale ressaltar que", "Vale lembrar que", "Em suma", "Em resumo", "Não é à toa que", "Prepare-se", "Fique ligado", "Fique de olho", "Sem sombra de dúvidas", "Mergulhe", "Confira tudo abaixo", "Não perca".
- Varie a abertura: não repita a estrutura dos títulos recentes do site (lista na mensagem).

FINANÇAS COM RESPONSABILIDADE (regra mais importante)
- O Vibecoin NÃO recomenda compra nem venda. Nunca escreva "hora de comprar", "vale a pena comprar", "não fique de fora", "oportunidade única", "lucro garantido", "vai disparar", "vai explodir", "rumo à lua", "compre agora" ou equivalentes.
- Nunca faça previsão de preço. Projeções e opiniões de analistas só atribuídas a quem as fez ("segundo a analista X, da empresa Y"), apresentadas como opinião, nunca como fato.
- Preço e variação só com os números das fontes e com o momento a que se referem ("na manhã de terça", "nas últimas 24 horas, segundo a CoinGecko").
- Golpes, ataques e projetos suspeitos: descreva com clareza o risco para o leitor.

ESTRUTURA (nesta ordem)
1. title: 30 a 70 caracteres. Nome da moeda/empresa/órgão primeiro, depois o fato. Só a primeira letra maiúscula (e nomes próprios). Sem caixa alta, sem "?" no fim, sem caça-clique.
2. Lide (1º bloco, tipo "p", 2 a 3 frases): o quê, quem, quando, onde. A focusKeyword aparece aqui.
3. Desenvolvimento em 2 ou mais seções, cada uma aberta por um "h2" informativo que diga o que o leitor encontra ali (ex.: "O que muda para quem tem ETH", "Quanto o bitcoin subiu na semana", "O que diz o Banco Central") — nunca genérico ("Introdução", "Detalhes", "Conclusão"). Detalhes das fontes, com números, datas e declarações atribuídas. Use "h3" só para subdividir uma seção longa. Use "ul" só quando houver itens de verdade.
4. Seção "O que isso muda para quem está no Brasil" (h2 próprio) SÓ se as fontes trouxerem dado concreto para o Brasil (regra do Banco Central, da CVM ou da Receita, preço em reais, corretora que opera aqui). Sem esse dado, OMITA a seção inteira (nunca escreva frase genérica no lugar).
5. Última seção: h2 exatamente "Mais sobre <focusKeyword>" com contexto concreto tirado das fontes (histórico, números anteriores, quem é a empresa ou o órgão). Nada de "fique de olho" ou "acompanhe o Vibecoin".
6. Não escreva "Fonte:" no fim nem aviso de risco: o crédito e o aviso entram automaticamente.

TAMANHO E VALOR PRÓPRIO
- Alvo: 500 a 700 palavras no corpo (conte!). Mínimo absoluto 400: abaixo disso a matéria é reprovada. Use TODOS os detalhes das fontes. Se as fontes não tiverem substância para isso sem enrolar, responda publish=false.
- Junte o que cada fonte traz de diferente: a matéria deve ser a mais completa em português sobre o assunto.
- Explique o contexto para quem está chegando agora e o que ainda falta saber.
- Nunca encha linguiça repetindo o lide com outras palavras.

LINKS (formato [texto âncora](url), dentro de "p" ou "ul")
- Use até 3 LINKS INTERNOS e de 1 a 2 LINKS EXTERNOS, escolhidos SOMENTE das listas da mensagem. Endereço fora das listas é removido.
- Para moedas, prefira o link interno da cotação dela (/cotacoes/...) na primeira menção fora do lide.
- Texto âncora descritivo, nunca "clique aqui" ou o endereço cru. No máximo 1 link por parágrafo. Não ponha link no lide.
- Link só onde o trecho tem relação real com a página linkada. NUNCA escreva frase só para encaixar link nem fale do próprio site.

PRECISÃO — NUNCA INVENTE
1. Use SOMENTE fatos presentes nas fontes. Nunca invente datas, preços, números, nomes, declarações ou detalhes. Na dúvida, omita.
2. Não traduza parágrafo por parágrafo: escreva um texto novo, com estrutura própria.
3. Não converta moedas nem fusos por conta própria: valores em dólar ficam em dólar, como na fonte.
4. Rumor, vazamento ou "fontes anônimas": escreva como tal ("ainda não confirmado") e nunca apresente como fato.
5. Citações: traduza e atribua a quem disse. No máximo 2 citações (tipo "quote", sem aspas no texto). Nunca invente citação.

QUANDO NÃO PUBLICAR (publish=false)
- Não é sobre cripto, mercado financeiro, economia ou finanças pessoais; é só análise técnica de gráfico ou previsão de preço; é conteúdo patrocinado, comunicado de projeto pequeno pedindo divulgação, pré-venda ou airdrop; rumor sem origem confiável; ou o assunto já está entre as matérias recentes do Vibecoin.

CAMPOS
- section: notícias gerais em "noticias"; bitcoin em "bitcoin"; outras moedas em "altcoins"; preços, juros, dólar e bolsa em "mercado"; finanças pessoais (renda fixa, impostos, orçamento) em "grana"; leis, BC, CVM, Receita, SEC em "regulacao" — sempre entre as permitidas.
- coins: só as da lista, as que são assunto de verdade (pode ser vazia em "grana" e "regulacao").
- tags: 3 a 6, nomes próprios e temas (ex.: "Bitcoin", "ETF", "Banco Central").`;

function sourcesBlock(sources: Source[]) {
  return sources.map((s, i) => `### FONTE ${i + 1}: ${s.name}\nTítulo: ${s.title}\nPublicado em: ${s.date}\nURL: ${s.url}\n\n${s.text}`).join("\n\n---\n\n");
}

const TOOL_PAGES = [
  ["/cotacoes", "tabela de cotações em reais do site"],
  ["/ferramentas/conversor", "conversor de criptomoedas para reais"],
  ["/ferramentas/calculadora-ir", "calculadora de imposto de renda sobre cripto"],
  ["/ferramentas/simulador-aporte", "simulador de aporte mensal em cripto"],
];

// ───────────── Fontes e mídia ─────────────

async function gatherSources(group: SourceItem[]) {
  const sources: Source[] = [];
  const medias: SourceMedia[] = [];
  for (const g of group) {
    const page = await fetchArticle(g.url);
    const full = countWords(page.text) >= countWords(g.summary ?? "") ? page.text : (g.summary ?? "");
    // Limite por fonte: prompt menor = resposta mais rápida (e menos lixo de página).
    const text = full.split(/\s+/).slice(0, 1500).join(" ");
    if (countWords(text) >= 40) sources.push({ name: g.feed_name, title: g.title, url: g.url, date: g.published_at, text });
    const rss = json<SourceMedia>(g.media, emptyMedia());
    // Ordem: imagens do RSS (escolhidas pelo próprio site) e depois as da página.
    const merged = mergeMedia(rss, page.media);
    merged.images = merged.images.map((i) => ({ ...i, source: g.feed_name }));
    medias.push(merged);
  }
  return { sources, media: mergeMedia(...medias) };
}

/** Confere no YouTube se o vídeo existe e pode ser incorporado (oEmbed responde 401/404 se não). */
async function videoInfo(id: string) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string };
    return { youtubeId: id, title: data.title ?? "Vídeo" };
  } catch {
    return null;
  }
}

const cleanTags = (tags: string[]) =>
  [...new Map((tags ?? []).map((t) => t.trim().replace(/^#/, "")).filter((t) => t.length >= 2 && t.length <= 40).map((t) => [t.toLowerCase(), t])).values()].slice(0, 6);

// ───────────── Escrever ─────────────

export async function writeArticle(group: SourceItem[], ctx: WriteContext): Promise<WriteResult> {
  const { sources, media } = await gatherSources(group);
  const sourceWords = sources.reduce((n, s) => n + countWords(s.text), 0);
  if (sourceWords < 200) return { ok: false, status: "skipped", reason: `pouco conteúdo nas fontes (${sourceWords} palavras)` };

  // Mídia antes do Gemini: sem capa utilizável a pauta sai, sem gastar cota.
  const chosen = await chooseMedia(media.images, 3);
  if (!chosen) return { ok: false, status: "skipped", reason: `sem imagem de capa utilizável: grande, horizontal e nítida (${media.images.length} candidata(s))` };
  let video: BuiltArticle["video"];
  for (const id of media.videos.slice(0, 3)) {
    const info = await videoInfo(id);
    if (info) {
      video = info;
      break;
    }
  }

  const coinPages = ctx.coins.map((c) => [`/cotacoes/${c.slug}`, `cotação do ${c.name} (${c.symbol}) em reais`] as const);
  const internal = [...ctx.related.map((r) => [r.url, r.title] as const), ...coinPages, ...TOOL_PAGES];
  const external = [...sources.map((s) => [s.url, `matéria original (${s.name})`] as const), ...media.links.slice(0, 6).map((u) => [u, "link oficial"] as const)];
  const allowed = [...internal.map(([u]) => u), ...external.map(([u]) => u)];

  const prompt = `Editorias permitidas: ${ctx.sections.join(", ")}.

Matérias publicadas recentemente pelo Vibecoin (não repita o assunto nem a estrutura do título):
${ctx.recentTitles.map((t) => `- ${t}`).join("\n") || "- (nenhuma)"}

LINKS INTERNOS PERMITIDOS (até 3, só os que tiverem relação real com o assunto):
${internal.map(([u, t]) => `- ${u} — ${t}`).join("\n")}

LINKS EXTERNOS PERMITIDOS (use 1 a 2):
${external.map(([u, t]) => `- ${u} — ${t}`).join("\n")}

MÍDIA: a matéria terá ${chosen.body.length + 1} imagem(ns)${video ? " e um vídeo do YouTube logo depois do lide" : ""}, inseridas automaticamente. Não descreva imagens nem escreva "veja o vídeo".

Escreva uma matéria a partir das fontes abaixo. A FONTE 1 é a principal; as outras complementam o mesmo assunto.

${sourcesBlock(sources)}`;

  const schema = schemaFor(ctx.coins);
  const sourceText = sources.map((s) => `${s.title} ${s.text}`).join(" ");
  let lastIssues: string[] = [];
  let previous: GeminiDraft | undefined;
  let model = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const retry = previous
      ? `\n\n---\nSUA VERSÃO ANTERIOR (JSON):\n${JSON.stringify(previous)}\n\nEla foi reprovada na checagem de qualidade. Gere de novo a matéria COMPLETA, mantendo o que estava certo (sem encurtar o texto) e corrigindo especificamente:\n${lastIssues.map((i) => `- ${i}`).join("\n")}`
      : "";
    const res = await generateJson<GeminiDraft>({ system: SYSTEM, prompt: prompt + retry, schema });
    model = res.model;
    const raw = res.data;
    if (!raw.publish && attempt === 1) return { ok: false, status: "skipped", reason: `recusada pelo redator (${raw.reason})` };

    const { draft, fixes } = autoFix({ ...raw, body: raw.body ?? [] });
    const { body: linked, removed } = sanitizeLinks(draft.body as DraftBlock[], allowed);
    if (removed.length) fixes.push(`links fora da lista removidos: ${removed.length}`);
    const issues = checkDraft({ ...draft, body: linked }, { sourceText, minWords: ctx.minWords, allowedSections: ctx.sections, section: raw.section });
    if (issues.length) {
      lastIssues = issues;
      previous = raw;
      continue;
    }

    const coins = (raw.coins ?? []).filter((s, i, all) => ctx.coins.some((c) => c.slug === s) && all.indexOf(s) === i);
    const keyword = draft.focusKeyword.trim();
    const body = assembleBody({
      draft: linked,
      focusKeyword: keyword,
      images: chosen.body.map((p) => ({ src: p.url, width: p.width, height: p.height, credit: imageCredit(p) })),
      video: video && { youtubeId: video.youtubeId, title: `${keyword}: ${video.title}`.slice(0, 200) },
      related: ctx.related,
      coins: coins.map((s) => ctx.coins.find((c) => c.slug === s)!),
    });
    const words = countWords(
      body.map((b) => (b.type === "ul" ? b.items.join(" ") : b.type === "p" || b.type === "h2" || b.type === "h3" || b.type === "quote" ? b.text : "")).map(stripLinks).join(" "),
    );
    return {
      ok: true,
      article: {
        section: raw.section,
        title: draft.title,
        excerpt: draft.excerpt,
        metaDescription: draft.metaDescription,
        focusKeyword: keyword,
        tags: cleanTags(raw.tags),
        coins,
        body,
        words,
        readMinutes: Math.max(2, Math.round(words / 200)),
        cover: chosen.cover,
        coverAlt: draft.title,
        bodyImages: chosen.body,
        video,
        sources: sources.map((s) => ({ name: s.name, url: s.url })),
        model,
        attempts: attempt,
        fixes,
      },
    };
  }
  return { ok: false, status: "failed", reason: `reprovada na checagem após ${MAX_ATTEMPTS} tentativas: ${lastIssues.join(" | ")}` };
}

/** Agência Brasil: licença CC BY (crédito obrigatório); o resto, reprodução com crédito do veículo. */
const imageCredit = (p: ProbedImage) =>
  p.source ? (p.source.startsWith("Agência Brasil") ? `Imagem: ${p.source} (CC BY 4.0)` : `Imagem: reprodução/${p.source}`) : undefined;

/** Grava as imagens em MEDIA_DIR e troca os endereços remotos pelos nossos. */
export async function localizeImages(a: BuiltArticle, slug: string) {
  const cover = await storeImage(a.cover, slug);
  const map = new Map<string, { src: string; width: number; height: number }>();
  let n = 2;
  for (const img of a.bodyImages) map.set(img.url, await storeImage(img, `${slug}-${n++}`));
  const body = a.body.map((b) => {
    if (b.type !== "img") return b;
    const local = map.get(b.src);
    return local ? { ...b, ...local } : b;
  });
  return { cover, body, coverCredit: imageCredit(a.cover) ?? null };
}
