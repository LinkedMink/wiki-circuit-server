import xpath from 'xpath';
import xmldom from 'xmldom';

import AgingCache from "../Shared/AgingCache";

export enum JobStatus {
  Ready = 'ready',
  Running = 'running',
  Faulted = 'faulted',
  Complete = 'complete'
}

const MAX_PARALLEL_DOWNLOADS = 5;
const MAX_ARTICLE_DEPTH = 3;
const WIKIPEDIA_ARTICLE_BASE_URL = 'https://en.wikipedia.org/wiki/';
const WIKIPEDIA_ARTICLE_PREFIX = '/wiki/';
const KEEP_FINISHED_JOB_MILLISECONDS = 30000;

interface LinkTotals {
  links: number;
  queued: number;
  downloaded: number;
}

export interface ArticleData {
  depth: number,
  referenceCount: number,
  linkedArticles: Array<string> | null
}

export class ArticleJob {
  constructor(
    articleName: string, 
    jobMap: Map<string, ArticleJob>, 
    resultCache: AgingCache<string, Map<string, ArticleData>>) {
    this.articleName = articleName;
    this.jobMap = jobMap;
    this.resultCache = resultCache;
    this.jobStatus = JobStatus.Ready;

    let newTotals: LinkTotals = { links: 0, queued: 0, downloaded: 0 };
    const totals = new Map([[0, newTotals]]);
    for (let i = 1; i < MAX_ARTICLE_DEPTH; i++) {
      newTotals = { links: 0, queued: 0, downloaded: 0 };
      totals.set(i, newTotals);
    }
    this.totals = totals;
  }

  start = () => {
    this.jobStatus = JobStatus.Running;
    this.startTime = Date.now();

    this.getArticleHtml(this.articleName, 1);
  }

  get status() {
    return {
      status: this.jobStatus,
      id: this.articleName,
      progress: this.progress,
      startTime: this.startTime,
      endTime: this.endTime,
      runTime: this.runTime,
      message: this.message,
      totals: this.totals,
    }
  }

  private getArticleHtml = (articleName: string, depth: number) => {
    let downloadPromise: Promise<void>;
    const articleData: ArticleData = { depth: depth, referenceCount: 1, linkedArticles: null };
    this.result.set(articleName, articleData);
  
    const textHandler = (text: string) => {
      // Parse the text in the article HTML and find links to other articles
      const parser = new xmldom.DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const body = doc.getElementById('bodyContent');
      if (!body) {
        this.finishError();
        return;
      }

      const linkIterator = xpath.evaluate(
          `//a[starts-with(@href,'${WIKIPEDIA_ARTICLE_PREFIX}')]`, 
          body, 
          <any>null, 
          XPathResult.UNORDERED_NODE_ITERATOR_TYPE, 
          <any>null);
  
      // Iterate through the linked articles
      const nextDepth = depth + 1;
      const linkedArticles = this.addLinkedArticles(linkIterator, nextDepth);
      articleData.linkedArticles = linkedArticles;
  
      // Update and report how far we've gotten with downloading and processing all data
      this.activePromises.delete(downloadPromise);
      const total0 = this.totals.get(0);
      if (total0) {
        total0.downloaded++;
      }
      const totalDepth = this.totals.get(depth);
      if (totalDepth) {
        totalDepth.downloaded++;
      }
      this.setProgress();
  
      // Are we out of articles to download or something caused us to terminate early?
      if (this.queue.size === 0 || this.result.size === 0) {
        this.finishSuccess();
        return;
      }
  
      // If we have more to download dequeue the next article to download
      while (this.activePromises.size <= MAX_PARALLEL_DOWNLOADS) {
        const nextArticle = this.queue[Symbol.iterator]().next();
        if (nextArticle) {
          this.queue.delete(nextArticle.value[0]);
          this.getArticleHtml(nextArticle.value[0], nextArticle.value[1]);
        }
      }
    }
  
    const responseHandler = (response: Response) => {
      if (!response.ok) {
        this.finishError();
        return;
      }
  
      response.text()
        .then(textHandler)
        .catch(this.finishError);
    }
  
    const url = WIKIPEDIA_ARTICLE_BASE_URL + articleName;
    downloadPromise = fetch(url, { method: 'GET' })
      .then(responseHandler)
      .catch(this.finishError);
  
    this.activePromises.add(downloadPromise);
  }

  private setProgress = () => {
    /* Predicted work should expand exponentially with depth
    for (const [key, value] of jobState.totals) {
      if (key === 0) {
        continue;
      }
    }
    */
    const total0 = this.totals.get(0);
    if (total0) {
      this.progress = total0.downloaded / total0.queued;
    }
  }
  
  private addLinkedArticles = (linkIterator: any, depth: number) => {
    const linkedArticles = [];
    let linkNode = linkIterator.iterateNext();
  
    while (linkNode) {
      const linkName = linkNode.textContent.substring(WIKIPEDIA_ARTICLE_PREFIX.length);
      linkedArticles.push(linkName);

      const total0 = this.totals.get(0);
      const totalDepth = this.totals.get(0);

      if (total0 && totalDepth) {
        total0.links++;
        totalDepth.links++;
      }
  
      if (depth <= MAX_ARTICLE_DEPTH && !this.downloading.has(linkName)) {
        this.downloading.add(linkName);
        this.queue.set(linkName, depth);
        if (total0 && totalDepth) {
          total0.queued++;
          totalDepth.queued++;
        }
      }
  
      const resultLink = this.result.get(linkName);
      if (resultLink) {
        resultLink.referenceCount++;
      }
  
      linkNode = linkIterator.iterateNext();
    }
  
    return linkedArticles;
  }

  private finishSuccess = () => {
    this.resultCache.set(this.articleName, this.result);
    this.jobStatus = JobStatus.Complete;
    this.finish();
  }

  private finishError = (error = null) => {
    this.result.clear();
    this.message = error || 'An error has occurred';
    this.jobStatus = JobStatus.Faulted;
    this.finish();
  }

  private finish = () => {
    this.endTime = Date.now();
    this.runTime = this.endTime - this.startTime;
    setTimeout(this.clearJob, KEEP_FINISHED_JOB_MILLISECONDS)

    console.log()
  }

  private clearJob = () => {
    this.jobMap.delete(this.articleName);
  }

  private articleName: string;
  private jobMap: Map<string, ArticleJob>;
  private resultCache: AgingCache<string, Map<string, ArticleData>>;

  private jobStatus: JobStatus;
  private startTime: number = 0;
  private endTime: number = 0;
  private runTime: number = 0;
  private progress: number = 0;
  private message: string = '';

  private result: Map<string, ArticleData> = new Map();
  private queue: Map<string, number> = new Map();
  private downloading: Set<string> = new Set();
  private activePromises: Set<Promise<void>> = new Set();
  private totals: Map<number, LinkTotals>;
}