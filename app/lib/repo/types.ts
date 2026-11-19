// Contrato das fontes de dados. Há duas implementações:
// - mock.server.ts: dados de exemplo em memória (desenvolvimento, sem banco);
// - mysql.server.ts: MySQL da Hostinger (produção).
// content.server.ts escolhe a fonte e cuida da formatação para as telas.
import type { SectionSlug } from "../site";
import type { Broker, Coin, MarketOverview, MonthlyPrice, Post } from "../types";

export interface PostFilter {
  section?: SectionSlug;
  /** Matérias que citam esta moeda. */
  coin?: string;
  /** Só guias: 1 iniciante, 2 intermediário, 3 avançado. */
  level?: number;
  exclude?: string[];
}

export interface Repo {
  findPosts(filter: PostFilter, offset: number, limit: number): Promise<{ items: Post[]; total: number }>;
  findFeatured(): Promise<Post | null>;
  findMostRead(limit: number, exclude: string[]): Promise<Post[]>;
  /** unpublished: inclui rascunhos e arquivadas (só para a pré-visualização do admin). */
  findPost(section: string, slug: string, unpublished?: boolean): Promise<Post | null>;
  /** Todos os posts publicados (sitemap, RSS). */
  allPosts(limit?: number): Promise<Post[]>;
  /** Busca: todos os termos precisam aparecer (sem diferenciar acentos). */
  searchPosts(terms: string[], limit: number): Promise<Post[]>;
  countPostsSince(isoDate: string): Promise<number>;
  sectionStats(): Promise<{ section: SectionSlug; total: number; latest: string | null }[]>;

  /** Moedas acompanhadas, em ordem de valor de mercado. */
  coins(): Promise<Coin[]>;
  coin(slug: string): Promise<Coin | null>;
  /** Fechamentos mensais em reais (simulador). Vazio se não houver histórico. */
  history(slug: string): Promise<MonthlyPrice[]>;
  market(): Promise<MarketOverview | null>;
  brokers(): Promise<Broker[]>;
}
