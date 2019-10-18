import fetch from 'node-fetch';
import cheerio from 'cheerio';

import { config } from '../Config';
import { JobWork, Job } from '../Shared/Job';

const testWikipediaNamespaceRegEx = new RegExp([
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
].join("|"));

const WIKIPEDIA_ARTICLE_BASE_URL = 'https://en.wikipedia.org/wiki/';
const WIKIPEDIA_ARTICLE_PREFIX = '/wiki/';
const WIKIPEDIA_CONTENT_ID = '#mw-content-text';
const WIKIPEDIA_AUTHORITY_BLOCK_ID = '#Authority_control_files';

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

export class ArticleJobWork extends JobWork {
  constructor() {
    super();
    const totals = new Map([
      [0, { links: 1, queued: 1, downloaded: 0 }],
      [1, { links: 1, queued: 1, downloaded: 0 }]
    ]);
    for (let i = 2; i <= config.jobParams.maxDepth; i++) {
      totals.set(i, { links: 0, queued: 0, downloaded: 0 });
    }
    this.totals = totals;
  }

  doWork = (job: Job, params: any): void => {
    this.job = job;
    this.articleName = params.id;
    this.getArticleHtml(this.articleName, 1);
  }

  private totalArray = () => {
    const totals: Object[] = [];
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
      while (this.activePromises.size <= config.jobParams.maxParallelDownloads) {
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
    /* TODO Predicted work should expand exponentially with depth not linearly */
    const total0 = this.totals.get(0);
    if (this.job && total0) {
      this.job.progress = {
        completed: total0.downloaded / total0.queued,
        message: '',
        data: this.totalArray()
      };
    }
  }
  
  private parseLinksFromHtml = (text: string): { [s: string]: number; } => {
    const links: { [s: string]: number; } = {};

    const document = cheerio.load(text);
    document(WIKIPEDIA_CONTENT_ID)
      .find(`a[href^='${WIKIPEDIA_ARTICLE_PREFIX}']`)
      .each(function(index, element) {
        if (document(element).parents(WIKIPEDIA_AUTHORITY_BLOCK_ID).length > 0) {
          return;
        };

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
      if (depth <= config.jobParams.maxDepth && !job.downloading.has(link)) {
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

    const sortedResult = resultArray.sort(function(a, b) {
      return b.referenceCount - a.referenceCount;
    });
    
    return sortedResult;
  }

  private finishSuccess = () => {
    const sortedResult = this.getSortedResult();
    if (this.job) {
      this.job.complete(sortedResult);
    }
    this.isFinished = true;
  }

  private finishError = (error?: Error | string) => {
    if (this.job) {
      this.job.fault(error);
    }
    this.isFinished = true;
  }

  private job?: Job;
  private articleName: string = '';
  private isFinished: boolean = false;
  private result: Map<string, ArticleData> = new Map();
  private queue: Map<string, number> = new Map();
  private downloading: Set<string> = new Set();
  private activePromises: Set<Promise<void>> = new Set();
  private totals: Map<number, LinkTotals>;
}