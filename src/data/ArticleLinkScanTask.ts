import EventEmitter from "events";
import { config } from "../infastructure/Config";
import { ConfigKey } from "../infastructure/ConfigKey";
import { IProgressModel } from "../models/api/IProgressModel";
import { IRunnableTask, RunnableTaskEvent } from "./IRunnableTask";
import { getAxiosForWikipedia } from "../infastructure/Axios";
import {
  IArticleLinkScanParams,
  IArticleLinkScanResult,
  IArticleLinkScanProgress,
  IArticleLinkScanState,
  IArticleResult,
  ILinkTotals,
} from "./IArticleLinkScan";
import { findLinksInArticle } from "./ArticleParser";

const axios = getAxiosForWikipedia();

interface IArticleDataText {
  data: IArticleResult;
  text: string;
}

interface IArticleDepth {
  name: string;
  depth: number;
}

export class ArticleLinkScanTask
  extends EventEmitter
  implements
    IRunnableTask<
      IArticleLinkScanParams,
      IArticleLinkScanResult,
      IArticleLinkScanProgress,
      IArticleLinkScanState
    > {
  private isFinished = false;
  private maxDepth = 2;
  private readonly result = new Map<string, IArticleResult>();
  private readonly queue = [] as IArticleDepth[];
  private readonly downloading = new Set<string>();
  private readonly activePromises = new Set<Promise<string | void>>();
  private readonly totals = new Map([
    [0, { links: 1, queued: 1, downloaded: 0 }],
    [1, { links: 1, queued: 1, downloaded: 0 }],
  ]);

  start(params: IArticleLinkScanParams): boolean {
    this.maxDepth = params.targetDepth;
    for (let i = 2; i <= this.maxDepth; i++) {
      this.totals.set(i, { links: 0, queued: 0, downloaded: 0 });
    }

    void this.getArticleHtml(params.articleName, 1);
    return true;
  }

  suspend(): IArticleLinkScanState {
    throw new Error("Method not implemented.");
  }

  cancel(): Promise<boolean> {
    this.isFinished = true;
    return Promise.all(this.activePromises).then(() => true);
  }

  registerOnComplete(handler: (result: IArticleLinkScanResult) => void): void {
    this.on(RunnableTaskEvent.Complete, handler);
  }

  registerOnUpdate(handler: (update: IProgressModel<Record<number, ILinkTotals>>) => void): void {
    this.on(RunnableTaskEvent.Update, handler);
  }

  registerOnFault(handler: (reason?: unknown) => void): void {
    this.on(RunnableTaskEvent.Fault, handler);
  }

  private getArticleHtml = (articleName: string, depth: number): Promise<void> => {
    const data: IArticleResult = {
      articleName: articleName,
      depth,
      referenceCount: 1,
      linkedArticles: null,
    };
    this.result.set(articleName, data);

    const downloadPromise = axios
      .get(articleName)
      .then(response => {
        if (response.status !== 200) {
          throw new Error(`${response.status} ${response.statusText}: ${articleName}`);
        }
        return {
          data,
          text: response.data as string,
        } as IArticleDataText;
      })
      .then(this.handleHtmlResult)
      .catch(e => {
        this.isFinished = true;
        this.emit(RunnableTaskEvent.Fault, e);
      })
      .finally(() => {
        this.activePromises.delete(downloadPromise);

        // Are we out of articles to download or something caused us to terminate early?
        if (this.isFinished) {
          return;
        }

        if (this.queue.length === 0) {
          if (this.activePromises.size === 0) {
            const sortedResult = Array.from(this.result.values()).sort(
              (a, b) => b.referenceCount - a.referenceCount
            );
            this.emit(RunnableTaskEvent.Complete, sortedResult);
          }
          return;
        }

        // If we have more to download dequeue the next article to download
        const maxParallelDownloads = config.getNumber(ConfigKey.TaskMaxParallelDownloads);
        while (this.queue.length > 0 && this.activePromises.size <= maxParallelDownloads) {
          const nextArticle = this.queue.shift();
          if (nextArticle) {
            void this.getArticleHtml(nextArticle.name, nextArticle.depth);
          }
        }
      });

    this.activePromises.add(downloadPromise);
    return downloadPromise;
  };

  private setProgress = (): void => {
    /* TODO Predicted work should expand exponentially with depth not linearly */
    const total0 = this.totals.get(0);
    if (total0) {
      const resultSample = {} as Record<number, ILinkTotals>;
      this.totals.forEach((v, k) => (resultSample[k] = v));
      this.emit(RunnableTaskEvent.Update, {
        completedRatio: total0.downloaded / total0.queued,
        resultSample,
      });
    }
  };

  private addLinkedArticles = (links: Record<string, number>, depth: number): void => {
    const total0 = this.totals.get(0);
    const totalDepth = this.totals.get(depth);

    for (const [link, count] of Object.entries(links)) {
      if (depth <= this.maxDepth && !this.downloading.has(link)) {
        this.downloading.add(link);

        if (total0 && totalDepth) {
          total0.links += count;
          totalDepth.links += count;
        }

        this.queue.push({ name: link, depth });
        if (total0 && totalDepth) {
          total0.queued++;
          totalDepth.queued++;
        }
      }

      const resultLink = this.result.get(link);
      if (resultLink) {
        resultLink.referenceCount++;
      }
    }
  };

  private handleHtmlResult = (article: IArticleDataText) => {
    const links = findLinksInArticle(article.text);
    article.data.linkedArticles = links;
    this.addLinkedArticles(links, article.data.depth + 1);

    // Update and report how far we've gotten with downloading and processing all data
    const total0 = this.totals.get(0);
    if (total0) {
      total0.downloaded++;
    }
    const totalDepth = this.totals.get(article.data.depth);
    if (totalDepth) {
      totalDepth.downloaded++;
    }
    this.setProgress();
  };
}
