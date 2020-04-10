import express, { Request, Response } from "express";
import { IAgingCache } from "multilevel-aging-cache";
import WebSocket from "ws";

import { Job } from "../Shared/Job";
import { JobStatus, JobWork, IJob } from "../Shared/JobInterfaces";
import { getResponseObject, ResponseStatus } from "../Shared/Response";
import { logger } from "../Logger";

export const getJobRouter = (jobCache: IAgingCache<string, IJob>, createWork: () => JobWork) => {
  const router = express.Router();

  const executeOnPromiseOrEntry = <TEntry>(
    entry: null | TEntry | Promise<TEntry | null>, 
    execute: (toExecuteOn: TEntry) => boolean): boolean => {

    if (entry instanceof Promise) {
      entry.then((entryResult) => {
        if (entryResult) {
          return execute(entryResult);
        } 
      }).catch((error) => {
        if (error.stack) {
          logger.error(error.stack);
        }
        logger.error(error);
      })
    } else if (entry) {
      return execute(entry);
    }

    return false;
  }

  const getCachedJobIdsHandler = (req: Request, res: Response) => {
    const response = getResponseObject();
    const keysHandler = (keys: string[]) => {
      response.data = keys;
      res.send(response);
      return true;
    }

    executeOnPromiseOrEntry(jobCache.keys(), keysHandler);
  };

  const getJobByIdHandler = (req: Request, res: Response) => {
    const response = getResponseObject();

    const id = req.params.id;
    if (!id) {
      response.status = ResponseStatus.Failed;
      response.message = "id: required";
      res.status(400);
      res.send(response);
      return;
    }
    
    const entryHandler = (job: IJob) => {
      response.data = job.status();
      const result = job.result();
      if (result) {
        (response.data as any).result = result;
      }

      res.send(response);
      return true;
    }
    if (executeOnPromiseOrEntry(jobCache.get(id), entryHandler)) {
      return;
    }

    response.status = ResponseStatus.Failed;
    response.message = `No job exist for the specified ID: ${id}`;
    res.status(404);
    res.send(response);
  };

  const postJobByIdHandler = (req: Request, res: Response) => {
    const response = getResponseObject();

    const id = req.body.id;
    if (!id) {
      response.status = ResponseStatus.Failed;
      response.message = "id: required";
      res.status(400);
      res.send(response);
      return;
    }

    const entryHandler = (job: IJob) => {
      if (job.status().status === JobStatus.Complete) {
        response.status = ResponseStatus.Failed;
        response.message = `Job already completed and cached: ${id}`;
        res.status(400);
        res.send(response);
        return true;
      }

      if (job.status().status !== JobStatus.Faulted) {
        response.status = ResponseStatus.Failed;
        response.message = `Job already started: ${id}`;
        res.status(400);
        res.send(response);
        return true;
      }

      jobCache.delete(id);
      return false;
    }
    if (executeOnPromiseOrEntry(jobCache.get(id), entryHandler)) {
      return;
    }

    const newJob = new Job(id, createWork());
    jobCache.set(id, newJob);
    newJob.start(req.body);

    response.message = `Job started: ${id}`;
    res.send(response);
  };

  const webSocketConnectedHandler = (ws: WebSocket) => {
    ws.on("message", (message) => {
      const response = getResponseObject();

      let data;
      try {
        data = JSON.parse(message.toString());
      } catch (e) {
        response.status = ResponseStatus.Failed;
        response.message = "Message was not valid JSON";
        ws.send(JSON.stringify(response));
        return;
      }

      if (!data.id) {
        response.status = ResponseStatus.Failed;
        response.message = "id: required";
        ws.send(JSON.stringify(response));
        return;
      }

      const entryHandler = (job: IJob) => {
        response.data = job.status().progress;
        ws.send(JSON.stringify(response));
        return true;
      }
      if (executeOnPromiseOrEntry(jobCache.get(data.id), entryHandler)) {
        return;
      }

      response.status = ResponseStatus.Failed;
      response.message = `No job exist for the specified ID: ${data.id}`;
      ws.send(JSON.stringify(response));
    });
  };

  router.get("/", getCachedJobIdsHandler);
  router.get("/:id", getJobByIdHandler);
  router.post("/", postJobByIdHandler);
  router.ws("/job/progress", webSocketConnectedHandler);

  return router;
};
