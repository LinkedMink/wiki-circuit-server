export interface ILinkTotals {
  links: number;
  queued: number;
  downloaded: number;
}

export interface IArticleResult {
  articleName: string;
  depth: number;
  referenceCount: number;
  linkedArticles: Record<string, number> | null;
}

export interface IArticleLinkScanParams {
  articleName: string;
  targetDepth: number;
}

export type IArticleLinkScanResult = IArticleResult[];

export type IArticleLinkScanProgress = Record<number, ILinkTotals>;

export interface IArticleLinkScanState {
  keyId: string;
}
