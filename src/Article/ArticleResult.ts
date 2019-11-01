export interface ArticleResult {
  id: string;
  depth: number,
  referenceCount: number,
  linkedArticles: { [s: string]: number; } | null
}