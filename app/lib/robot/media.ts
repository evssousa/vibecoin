// Mídia das fontes (imagens, vídeos do YouTube e links oficiais), sem rede: só lê HTML/RSS.
// Mesmas regras do robô do Respawnou (que vieram do Anime Profile), adaptadas para cripto e finanças.
import { decodeEntities } from "./text.ts";

export interface MediaImage {
  url: string;
  alt?: string;
  /** Veículo de onde veio (crédito "Imagem: reprodução/<veículo>"). */
  source?: string;
}

export interface SourceMedia {
  images: MediaImage[];
  /** IDs de vídeos do YouTube (11 caracteres). */
  videos: string[];
  /** Links oficiais citados pela fonte (órgãos reguladores, bancos centrais, sites dos projetos). */
  links: string[];
}

export const emptyMedia = (): SourceMedia => ({ images: [], videos: [], links: [] });

// Imagens que não servem: ícones, logos, avatares, emojis, pixels de rastreio, anúncios, gráficos de cotação embutidos.
const BAD_IMAGE = /sprite|icon|logo|avatar|placeholder|1x1|pixel|emoji|smiley|gravatar|badge|banner-ad|doubleclick|\/ads?\/|tradingview\.com\/x\//i;

/** Domínios aceitos como link externo "oficial" (além das próprias fontes). */
const OFFICIAL = [
  /^https:\/\/(www\.)?bcb\.gov\.br\//,
  /^https:\/\/(www\.)?gov\.br\/(cvm|receitafederal|fazenda)\//,
  /^https:\/\/(www\.)?b3\.com\.br\//,
  /^https:\/\/(www\.)?sec\.gov\//,
  /^https:\/\/(www\.)?federalreserve\.gov\//,
  /^https:\/\/(www\.)?ecb\.europa\.eu\//,
  /^https:\/\/(www\.)?esma\.europa\.eu\//,
  /^https:\/\/(www\.)?bitcoin\.org\//,
  /^https:\/\/(www\.)?ethereum\.org\//,
  /^https:\/\/blog\.ethereum\.org\//,
  /^https:\/\/(www\.)?solana\.com\//,
  /^https:\/\/(www\.)?coinbase\.com\/blog\//,
  /^https:\/\/(www\.)?binance\.com\/[a-z-]+\/(blog|support\/announcement)\//,
  /^https:\/\/(www\.)?blackrock\.com\//,
];

export const isOfficialLink = (u: string) => OFFICIAL.some((re) => re.test(u));

const attr = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"));
  return m ? decodeEntities(m[2] ?? m[3] ?? "").trim() : "";
};

function ytIds(html: string) {
  const ids = new Set<string>();
  const patterns = [
    /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/g,
    /youtube\.com\/watch\?[^"'\s<>]*v=([A-Za-z0-9_-]{11})/g,
    /youtu\.be\/([A-Za-z0-9_-]{11})/g,
  ];
  for (const re of patterns) for (const m of html.matchAll(re)) ids.add(m[1]);
  return [...ids];
}

/** Lê imagens (com alt), vídeos e links oficiais de um trecho de HTML. */
export function mediaFromHtml(html: string, opts: { onlyArticle?: boolean } = {}): SourceMedia {
  let doc = html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ");
  const out = emptyMedia();

  // og:image vale para a página inteira (é a capa escolhida pelo próprio site).
  const og = doc.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/i)?.[0];
  if (og) {
    const url = attr(og, "content");
    if (/^https?:\/\//.test(url)) out.images.push({ url });
  }

  if (opts.onlyArticle) {
    doc = doc.replace(/<(nav|header|footer|aside|form)\b[\s\S]*?<\/\1>/gi, " ");
    const article = doc.match(/<article\b[\s\S]*?<\/article>/i);
    if (article && article[0].length > 2000) doc = article[0];
  }

  for (const m of doc.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const srcset = attr(tag, "srcset") || attr(tag, "data-srcset");
    // No srcset, a última opção costuma ser a maior.
    const fromSet = srcset ? srcset.split(",").map((s) => s.trim().split(/\s+/)[0]).filter(Boolean).pop() : "";
    const url = fromSet || attr(tag, "data-src") || attr(tag, "src");
    if (!/^https?:\/\//.test(url) || BAD_IMAGE.test(url)) continue;
    const w = Number(attr(tag, "width"));
    if (w && w < 400) continue;
    out.images.push({ url, alt: attr(tag, "alt") || undefined });
  }
  out.videos = ytIds(doc);
  for (const m of doc.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    const href = decodeEntities(m[1]).split("#")[0];
    if (isOfficialLink(href) && !out.links.includes(href)) out.links.push(href);
  }
  return dedupe(out);
}

/** Mídia de um item de RSS (media:content, media:thumbnail, enclosure e o HTML do conteúdo). */
export function mediaFromRssItem(item: Record<string, unknown>, contentHtml: string): SourceMedia {
  const out = emptyMedia();
  const list = (v: unknown): Record<string, string>[] => (v == null ? [] : Array.isArray(v) ? v : [v]) as Record<string, string>[];
  const group = item["media:group"] as Record<string, unknown> | undefined;
  const nodes = [...list(item["media:content"]), ...list(group?.["media:content"]), ...list(item.enclosure), ...list(item["media:thumbnail"])];
  // Maiores primeiro (o thumbnail fica por último).
  nodes.sort((a, b) => Number(b["@width"] ?? 0) - Number(a["@width"] ?? 0));
  for (const n of nodes) {
    const url = decodeEntities(n["@url"] ?? "");
    const type = n["@type"] ?? n["@medium"] ?? "image";
    if (/^https?:\/\//.test(url) && /image/.test(type) && !BAD_IMAGE.test(url)) out.images.push({ url });
  }
  const fromHtml = mediaFromHtml(contentHtml);
  out.images.push(...fromHtml.images);
  out.videos.push(...fromHtml.videos);
  out.links.push(...fromHtml.links);
  return dedupe(out);
}

/** Junta mídias, sem repetir a mesma imagem (mesmo arquivo em tamanhos diferentes conta como igual). */
export function mergeMedia(...all: SourceMedia[]): SourceMedia {
  const out = emptyMedia();
  for (const m of all) {
    out.images.push(...m.images);
    out.videos.push(...m.videos);
    out.links.push(...m.links);
  }
  return dedupe(out);
}

/** Chave para reconhecer a mesma imagem com outro tamanho/parâmetro. */
export function imageKey(url: string) {
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname)
      .toLowerCase()
      .replace(/-\d{2,4}x\d{2,4}(?=\.\w+$)/, "") // WordPress: foto-300x169.jpg
      .replace(/\/resize\/\d+\/height\/\d+\//, "/resize/"); // Decrypt
  } catch {
    return url;
  }
}

function dedupe(m: SourceMedia): SourceMedia {
  const seen = new Set<string>();
  const images = m.images.filter((i) => {
    const k = imageKey(i.url);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { images, videos: [...new Set(m.videos)], links: [...new Set(m.links)] };
}

/**
 * Endereços da mesma imagem em alta resolução, do melhor para o original. Muitos CDNs aceitam
 * largura no endereço; sem isso a capa vem pequena demais para o Google Discover.
 */
export function imageCandidates(raw: string): string[] {
  const url = decodeEntities(raw);
  const out: string[] = [];
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host.endsWith("decrypt.co")) {
      out.push(u.toString().replace(/\/resize\/\d+\/height\/\d+\//, "/resize/1600/height/900/"));
    } else if (/-\d{2,4}x\d{2,4}\.(jpe?g|png|webp)$/i.test(u.pathname)) {
      // WordPress (Bitcoin Magazine, CryptoSlate...): o original fica sem o sufixo de tamanho.
      const full = new URL(u.toString().replace(/-\d{2,4}x\d{2,4}(?=\.\w+$)/, ""));
      full.search = "";
      out.push(full.toString());
    } else if (host.endsWith("sanity.io") || u.searchParams.has("w")) {
      u.searchParams.set("w", "1600");
      out.push(u.toString());
    }
  } catch {
    return [];
  }
  out.push(url);
  return [...new Set(out)];
}
