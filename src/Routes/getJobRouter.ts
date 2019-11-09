import express, { Request, Response } from 'express';

import { AgingCache } from '../Shared/AgingCache'
import { getResponseObject, ResponseStatus } from '../Shared/Request'
import { Job, JobWork, JobStatus } from '../Shared/Job'
import { config } from '../config'

export const getJobRouter = (createWork: () => JobWork) => {
  const router = express.Router();

  const jobCache: AgingCache<string, Job> = new AgingCache(
    config.jobParams.cacheMaxEntries, 
    config.jobParams.cacheKeepMinutes * 60 * 1000);

  const getCachedJobIdsHandler = (req: Request, res: Response) => {
    const response = getResponseObject();
    response.data = jobCache.keys()

    res.send(response);
  }

  const getJobByIdHandler = (req: Request, res: Response) => {
    const response = getResponseObject();
    
    const id = req.params.id;
    if (!id) {
      response.status = ResponseStatus.Failed;
      response.message = 'id: required';
      res.status(400);
      res.send(response);
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
    res.status(404);
    res.send(response);
  }

  const postJobByIdHandler = (req: Request, res: Response) => {
    const response = getResponseObject();
    
    const id = req.body.id;
    if (!id) {
      response.status = ResponseStatus.Failed;
      response.message = 'id: required';
      res.status(400);
      res.send(response);
      return;
    }

    const job = jobCache.get(id);
    if (job) {
      if (job.status.status === JobStatus.Complete) {
        response.status = ResponseStatus.Failed;
        response.message = `Job already completed and cached: ${id}`;
        res.status(400);
        res.send(response);
        return;
      }

      if (job.status.status !== JobStatus.Faulted) {
        response.status = ResponseStatus.Failed;
        response.message = `Job already started: ${id}`;
        res.status(400);
        res.send(response);
        return;
      }

      jobCache.delete(id);
    }

    const newJob = new Job(id, createWork());
    jobCache.set(id, newJob);
    newJob.start(req.body);

    response.message = `Job started: ${id}`;
    res.send(response);
  }

  router.get('/', getCachedJobIdsHandler);
  router.get(`/:id`, getJobByIdHandler);
  router.post('/', postJobByIdHandler);

  return router;
}