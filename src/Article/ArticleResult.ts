export interface IArticleResult {
  depth: number;
  id: string;
  referenceCount: number;
  linkedArticles: { [s: string]: number } | null;
}
