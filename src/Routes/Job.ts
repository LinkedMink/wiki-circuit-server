import { Express } from 'express';

import AgingCache from '../Shared/AgingCache'
import { ArticleJob, ArticleData, JobStatus } from './ArticleJob'
import { getMessageObject, ResponseStatus } from '../Types/Request'

const JOB_PATH = '/job';
const MAX_ARTICLE_CACHE_ENTRIES = 20;

const articleJobs: Map<string, ArticleJob> = new Map();
const articleCache: AgingCache<string, ArticleData[]> = new AgingCache(MAX_ARTICLE_CACHE_ENTRIES);

export default function addJobRoutes(app: Express) {
  app.get(JOB_PATH, function(req, res) {
    const response = getMessageObject();

    const jobs = []
    for (const jobPair of articleJobs) {
      jobs.push(jobPair[1].status)
    }

    response.data = {
      jobs: jobs,
      cache: articleCache.keys()
    }

    res.send(response);
  });

  app.get(`${JOB_PATH}/:articleName`, function(req, res) {
    const response = getMessageObject();
    
    const articleName = req.params.articleName;
    if (!articleName) {
      response.status = ResponseStatus.Failed;
      response.message = 'articleName: required';
      res.status(400).send(response);
      return;
    }

    const articleJob = articleJobs.get(articleName);
    if (articleJob) {
      response.data = articleJob.status;
      res.send(response);
      return;
    }

    response.status = ResponseStatus.Failed;
    response.message = `No job exist for the article: ${articleName}`;
    res.status(404).send(response);
  });

  app.get(`${JOB_PATH}/result/:articleName`, function(req, res) {
    const response = getMessageObject();
    
    const articleName = req.params.articleName;
    if (!articleName) {
      response.status = ResponseStatus.Failed;
      response.message = 'articleName: required';
      res.status(400).send(response);
      return;
    }

    const articleData = articleCache.get(articleName);
    if (articleData) {
      response.data = articleData;
      res.send(response);
      return;
    }

    response.status = ResponseStatus.Failed;
    response.message = `No cache entry exist for the article: ${articleName}`;
    res.status(404).send(response);
  });
  
  app.post(JOB_PATH, function(req, res) {
    const response = getMessageObject();
    
    const articleName = req.body.articleName;
    if (!articleName) {
      response.status = ResponseStatus.Failed;
      response.message = 'articleName: required';
      res.status(400).send(response);
      return;
    }

    const articleData = articleCache.get(articleName);
    if (articleData) {
      response.status = ResponseStatus.Failed;
      response.message = `Article data is in cache: ${articleName}`;
      res.status(400).send(response);
      return;
    }

    const articleJob = articleJobs.get(articleName);
    if (articleJob) {
      if (articleJob.status.status !== JobStatus.Faulted) {
        response.status = ResponseStatus.Failed;
        response.message = `Job already started: ${articleName}`;
        res.status(400).send(response);
        return;
      }

      articleJobs.delete(articleName);
    }

    const newJob = new ArticleJob(articleName, articleJobs, articleCache);
    articleJobs.set(articleName, newJob);
    newJob.start();

    response.message = `Job started for article: ${articleName}`;
    res.send(response);
  });
}