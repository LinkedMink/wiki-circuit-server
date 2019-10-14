import { Express } from 'express';

import AgingCache from '../Shared/AgingCache'
import { ArticleJob, ArticleData } from './ArticleJob'
import { getMessageObject, ResponseStatus } from '../Types/Request'

const JOB_PATH = '/job';
const MAX_ARTICLE_CACHE_ENTRIES = 20;

const articleJobs: Map<string, ArticleJob> = new Map();
const articleCache: AgingCache<string, Map<string, ArticleData>> = new AgingCache(MAX_ARTICLE_CACHE_ENTRIES);

export default function addJobRoutes(app: Express) {
  app.get(`${JOB_PATH}/:articleName`, function(req, res) {
    const response = getMessageObject();
    const articleName = req.params.articleName;

    const articleData = articleCache.get(articleName);
    if (articleData) {
      response.data = articleData
      res.send(response);
    }

    const articleJob = articleJobs.get(articleName);
    if (articleJob) {
      response.data = articleJob.status;
      res.send(response);
    }

    response.status = ResponseStatus.Failed;
    response.message = `No job or cache entry exist for the article: ${articleName}`;
    res.status(404).send(response);
  });
  
  app.post(JOB_PATH, function(req, res) {
    const response = getMessageObject();
    const articleName = req.body.articleName;

    const articleData = articleCache.get(articleName);
    if (articleData) {
      response.status = ResponseStatus.Failed;
      response.message = `Article data is in cache: ${articleName}`;
      res.status(400).send(response);
    }

    if (articleJobs.has(articleName)) {
      response.status = ResponseStatus.Failed;
      response.message = `Job already started: ${articleName}`;
      res.status(400).send(response);
    }

    const newJob = new ArticleJob(articleName, articleJobs, articleCache);
    articleJobs.set(articleName, newJob);
    newJob.start();

    response.message = `Job started for article: ${articleName}`;
    res.send(response);
  });
}