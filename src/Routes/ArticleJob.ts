import fetch from 'node-fetch';
import cheerio from 'cheerio';

import AgingCache from "../Shared/AgingCache";

export enum JobStatus {
  Ready = 'ready',
  Running = 'running',
  Faulted = 'faulted',
  Complete = 'complete'
}

const wikipediaNamespaceSet = [
  'User:', 
  'Wikipedia:', 
  'File:', 
  'MediaWiki:', 
  'Template:', 
  'Help:', 
  'Category:', 
  'Portal:', 
  'Book:', 
  'Draft:', 
  'TimedText:', 
  'Module:',

  'User_talk:', 
  'Wikipedia_talk:', 
  'File_talk:', 
  'MediaWiki_talk:', 
  'Template_talk:', 
  'Help_talk:', 
  'Category_talk:', 
  'Portal_talk:', 
  'Book_talk:', 
  'Draft_talk:', 
  'TimedText_talk:', 
  'Module_talk:',

  "Special:"
];

const testWikipediaNamespaceRegEx = new RegExp(wikipediaNamespaceSet.join("|"));

const MAX_PARALLEL_DOWNLOADS = 5;
const MAX_ARTICLE_DEPTH = 3;
const WIKIPEDIA_ARTICLE_BASE_URL = 'https://en.wikipedia.org/wiki/';
const WIKIPEDIA_ARTICLE_PREFIX = '/wiki/';
const KEEP_FINISHED_JOB_MILLISECONDS = 60000;

interface LinkTotals {
  links: number;
  queued: number;
  downloaded: number;
}

export interface ArticleData {
  id: string;
  depth: number,
  referenceCount: number,
  linkedArticles: { [s: string]: number; } | null
}

export class ArticleJob {
  constructor(
    articleName: string, 
    jobMap: Map<string, ArticleJob>, 
    resultCache: AgingCache<string, ArticleData[]>) {
    this.articleName = articleName;
    this.jobMap = jobMap;
    this.resultCache = resultCache;
    this.jobStatus = JobStatus.Ready;

    const totals = new Map([
      [0, { links: 1, queued: 1, downloaded: 0 }],
      [1, { links: 1, queued: 1, downloaded: 0 }]
    ]);
    for (let i = 2; i <= MAX_ARTICLE_DEPTH; i++) {
      totals.set(i, { links: 0, queued: 0, downloaded: 0 });
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
      totals: this.totalArray,
    }
  }

  private get totalArray() {
    const totals: Object[] = []
    for (const depthTotal of this.totals) {
      var copy = <any>Object.assign({}, depthTotal[1]);
      copy.depth = depthTotal[0]
      totals.push(copy);
    }

    return totals;
  }

  private getArticleHtml = (articleName: string, depth: number) => {
    let downloadPromise: Promise<void>;

    const articleData: ArticleData = { 
      id: articleName, 
      depth: depth, 
      referenceCount: 1, 
      linkedArticles: null 
    };
    this.result.set(articleName, articleData);
  
    const textHandler = (text: string) => {
      const links = this.parseLinksFromHtml(text);
      articleData.linkedArticles = links;

      // Iterate through the linked articles
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
      if (this.jobStatus === JobStatus.Faulted) {
        return;
      }

      if (this.queue.size === 0) {
        if (this.activePromises.size === 0) {
          this.finishSuccess();
        }

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
  
    const url = WIKIPEDIA_ARTICLE_BASE_URL + articleName;
    downloadPromise = fetch(url, { method: 'GET' })
      .then(response => {
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
  
  private parseLinksFromHtml = (text: string): { [s: string]: number; } => {
    const links: { [s: string]: number; } = {};

    const document = cheerio.load(text);
    document('#bodyContent')
      .find(`a[href^='${WIKIPEDIA_ARTICLE_PREFIX}']`)
      .each(function(index, element) {
        const linkName = element.attribs.href.substring(WIKIPEDIA_ARTICLE_PREFIX.length);
        if (!testWikipediaNamespaceRegEx.test(linkName)) {
          if (links[linkName] === undefined) {
            links[linkName] = 1
          } else {
            links[linkName]++;
          }
        }
      });

    return links;
  }
  
  private addLinkedArticles = (links: { [s: string]: number; }, depth: number) => {
    const job = this;
    const total0 = job.totals.get(0);
    const totalDepth = job.totals.get(depth);

    for (let [link, count] of Object.entries(links)) {
      if (depth <= MAX_ARTICLE_DEPTH && !job.downloading.has(link)) {
        job.downloading.add(link);

        if (total0 && totalDepth) {
          total0.links += count;
          totalDepth.links += count;
        }

        job.queue.set(link, depth);
        if (total0 && totalDepth) {
          total0.queued++;
          totalDepth.queued++;
        }
      }
  
      const resultLink = job.result.get(link);
      if (resultLink) {
        resultLink.referenceCount++;
      }
    };
  }

  private getSortedResult = () => {
    const resultArray = [];
    for (const result of this.result) {
      resultArray.push(result[1]);
    }

    return resultArray.sort(function(a, b) {
      return a.referenceCount - b.referenceCount;
    });
  }

  private finishSuccess = () => {
    const sortedResult = this.getSortedResult();
    this.resultCache.set(this.articleName, sortedResult);
    this.jobStatus = JobStatus.Complete;
    this.finish();
  }

  private finishError = (error?: Error | string) => {
    this.jobStatus = JobStatus.Faulted;

    if (typeof error === 'string') {
      this.message = error;
    } else if (error instanceof Error) {
      this.message = error.message
    }

    this.finish();
  }

  private finish = () => {
    this.endTime = Date.now();
    this.runTime = this.endTime - this.startTime;
    setTimeout(this.clearJob, KEEP_FINISHED_JOB_MILLISECONDS)

    console.log(this.status);
  }

  private clearJob = () => {
    this.jobMap.delete(this.articleName);
  }

  private articleName: string;
  private jobMap: Map<string, ArticleJob>;
  private resultCache: AgingCache<string, ArticleData[]>;

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