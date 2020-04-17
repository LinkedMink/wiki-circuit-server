import fetch from "node-fetch";

import { config, ConfigKey } from "../Config";
import { mapToObject } from "../Shared/CollectionHelpers";
import { Job } from "../Shared/Job";
import { IJobWork } from "../Shared/JobInterfaces";
import { IArticleResult } from "./ArticleResult";
import { findLinksInArticle } from "./FindLinksInArticle";

const WIKIPEDIA_ARTICLE_BASE_URL = "https://en.wikipedia.org/wiki/";
const maxDepth = config.getNumber(ConfigKey.JobMaxDepth);
const maxParallelDownloads = config.getNumber(ConfigKey.JobMaxParallelDownloads);

interface ILinkTotals {
  links: number;
  queued: number;
  downloaded: number;
}

interface IIdParams {
  id: string;
}

export class ArticleJobWork implements IJobWork {

  private job?: Job;
  private articleName = "";
  private isFinished = false;
  private result: Map<string, IArticleResult> = new Map();
  private queue: Map<string, number> = new Map();
  private downloading: Set<string> = new Set();
  private activePromises: Set<Promise<void>> = new Set();
  private isStopping = false;
  private totals: Map<number, ILinkTotals>;
  constructor() {
    const totals = new Map([
      [0, { links: 1, queued: 1, downloaded: 0 }],
      [1, { links: 1, queued: 1, downloaded: 0 }],
    ]);
    for (let i = 2; i <= maxDepth; i++) {
      totals.set(i, { links: 0, queued: 0, downloaded: 0 });
    }
    this.totals = totals;
  }

  public doWork = (job: Job, params: unknown): void => {
    this.job = job;
    this.articleName = (params as IIdParams).id;
    this.getArticleHtml(this.articleName, 1);
  }

  public stop = (): Promise<void> => {
    this.finishError();
    return Promise.all(this.activePromises).then(() => undefined);
  }

  private getArticleHtml = (articleName: string, depth: number): void => {
    // eslint-disable-next-line prefer-const
    let downloadPromise: Promise<void>;

    const articleData: IArticleResult = {
      id: articleName,
      depth,
      referenceCount: 1,
      linkedArticles: null,
    };
    this.result.set(articleName, articleData);

    const textHandler = (text: string): void => {
      const links = findLinksInArticle(text);
      articleData.linkedArticles = links;

      const nextDepth = depth + 1;
      this.addLinkedArticles(links, nextDepth);

      // Update and report how far we've gotten with downloading and processing all data
      const total0 = this.totals.get(0);
      if (total0) {
        total0.downloaded++;
      }
      const totalDepth = this.totals.get(depth);
      if (totalDepth) {
        totalDepth.downloaded++;
      }
      this.setProgress();
      this.activePromises.delete(downloadPromise);

      // Are we out of articles to download or something caused us to terminate early?
      if (this.isFinished) {
        return;
      }

      if (this.queue.size === 0) {
        if (this.activePromises.size === 0) {
          this.finishSuccess();
        }

        return;
      }

      // If we have more to download dequeue the next article to download
      while (this.queue.size > 0 && this.activePromises.size <= maxParallelDownloads) {
        const nextArticle = this.queue[Symbol.iterator]().next();
        if (nextArticle && nextArticle.value) {
          this.queue.delete(nextArticle.value[0]);
          this.getArticleHtml(nextArticle.value[0], nextArticle.value[1]);
        }
      }
    };

    const url = WIKIPEDIA_ARTICLE_BASE_URL + articleName;
    downloadPromise = fetch(url, { method: "GET" })
      .then((response) => {
        if (!response.ok) {
          this.finishError(`${response.status} ${response.statusText}: ${articleName}`);
          return;
        }

        response.text()
          .then(textHandler)
          .catch(this.finishError);
      })
      .catch(this.finishError);

    this.activePromises.add(downloadPromise);
  }

  private setProgress = (): void => {
    /* TODO Predicted work should expand exponentially with depth not linearly */
    const total0 = this.totals.get(0);
    if (this.job && total0) {
      this.job.progress({
        completed: total0.downloaded / total0.queued,
        message: "",
        data: mapToObject(this.totals),
      });
    }
  }

  private addLinkedArticles = (links: { [s: string]: number }, depth: number): void => {
    const total0 = this.totals.get(0);
    const totalDepth = this.totals.get(depth);

    for (const [link, count] of Object.entries(links)) {
      if (depth <= maxDepth && !this.downloading.has(link)) {
        this.downloading.add(link);

        if (total0 && totalDepth) {
          total0.links += count;
          totalDepth.links += count;
        }

        this.queue.set(link, depth);
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
  }

  private getSortedResult = (): IArticleResult[] => {
    const resultArray = [];
    for (const result of this.result) {
      resultArray.push(result[1]);
    }

    const sortedResult = resultArray.sort((a, b) => {
      return b.referenceCount - a.referenceCount;
    });

    return sortedResult;
  }

  private finishSuccess = (): void => {
    const sortedResult = this.getSortedResult();
    if (this.job) {
      this.job.complete(sortedResult);
    }
    this.isFinished = true;
  }

  private finishError = (error?: Error | string): void => {
    if (this.job) {
      this.job.fault(error);
    }
    this.isFinished = true;
  }
}
