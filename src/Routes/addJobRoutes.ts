import { Express } from 'express';

import AgingCache from '../Shared/AgingCache'
import { getMessageObject, ResponseStatus } from '../Shared/Request'
import { Job, JobWork, JobStatus } from '../Shared/Job'
import { config } from '../Config'

export default function addJobRoutes(
  app: Express, 
  path: string,
  createWork: () => JobWork) {
  const jobCache: AgingCache<string, Job> = new AgingCache(
    config.jobParams.cacheMaxEntries, 
    config.jobParams.cacheKeepMinutes * 60 * 1000);

  app.get(path, function(req, res) {
    const response = getMessageObject();
    response.data = jobCache.keys()

    res.send(response);
  });

  app.get(`${path}/:id`, function(req, res) {
    const response = getMessageObject();
    
    const id = req.params.id;
    if (!id) {
      response.status = ResponseStatus.Failed;
      response.message = 'id: required';
      res.status(400).send(response);
      return;
    }

    const job = jobCache.get(id);
    if (job) {
      response.data = job.status;
      const result = job.result;
      if (result) {
        (<any>response.data).result = result;
      }

      res.send(response);
      return;
    }

    response.status = ResponseStatus.Failed;
    response.message = `No job exist for the specified ID: ${id}`;
    res.status(404).send(response);
  });
  
  app.post(path, function(req, res) {
    const response = getMessageObject();
    
    const id = req.body.id;
    if (!id) {
      response.status = ResponseStatus.Failed;
      response.message = 'id: required';
      res.status(400).send(response);
      return;
    }

    const job = jobCache.get(id);
    if (job) {
      if (job.status.status === JobStatus.Complete) {
        response.status = ResponseStatus.Failed;
        response.message = `Job already completed and cached: ${id}`;
        res.status(400).send(response);
        return;
      }

      if (job.status.status !== JobStatus.Faulted) {
        response.status = ResponseStatus.Failed;
        response.message = `Job already started: ${id}`;
        res.status(400).send(response);
        return;
      }

      jobCache.delete(id);
    }

    const newJob = new Job(id, createWork());
    jobCache.set(id, newJob);
    newJob.start(req.body);

    response.message = `Job started: ${id}`;
    res.send(response);
  });
}