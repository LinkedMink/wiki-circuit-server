import express, { Request, Response, Router } from "express";
import { IAgingCache, AgingCacheWriteStatus } from "@linkedmink/multilevel-aging-cache";
import WebSocket from "ws";

import { Job } from "../Shared/Job";
import { JobStatus, IJobWork, IJob } from "../Shared/JobInterfaces";
import { getResponseFailed, getResponseSuccess } from "../Models/IResponseData";
import { IJobIdParams } from "../Models/IJobParameters";
//import { logger } from "../Logger";

export const getJobRouter = (jobCache: IAgingCache<string, IJob>, createWork: () => IJobWork): Router => {
  const router = express.Router();

  const jobProgressUpdater = (job: IJob): void => {
    const id = job.status().id;
    jobCache.set(id, job, true);
  }

  const startJob = async (id: string, req: Request, res: Response): Promise<void> => {
    const newJob = new Job(id, createWork(), jobProgressUpdater);
    newJob.start(req.body);

    const status = await jobCache.set(id, newJob);
    if (status === AgingCacheWriteStatus.Success) {
      res.send(getResponseSuccess(`Job started: ${id}`));
      return;
    } 

    res.status(500)
    res.send(getResponseFailed(`Failed to store job: ${id}`));
  }

  const getCachedJobIdsHandler = async (req: Request, res: Response): Promise<void> => {
    const keys = await jobCache.keys();

    const response = getResponseSuccess(keys);
    res.send(response);
  };

  const getJobByIdHandler = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id;
    if (!id) {
      res.status(400);
      res.send(getResponseFailed("id: required"));
      return;
    }

    const job = await jobCache.get(id);

    if (job === null) {
      res.status(404);
      res.send(getResponseFailed(`No job exist for the specified ID: ${id}`));
      return
    }

    const data = job.status();
    const result = job.result();
    if (result) {
      data.result = result;
    }

    res.send(getResponseSuccess(data));
  };

  const postJobByIdHandler = async (req: Request, res: Response): Promise<void> => {
    const id = req.body.id;
    const refresh = req.body.refresh;

    if (!id) {
      res.status(400);
      res.send(getResponseFailed("id: required"));
      return;
    }

    const job = await jobCache.get(id);
    if (!job) {
      return startJob(id, req, res);
    }

    if (!refresh) {
      if (job.status().status === JobStatus.Complete) {
        res.status(400);
        res.send(getResponseFailed(`Job already completed and cached: ${id}`));
        return;
      }
  
      if (job.status().status !== JobStatus.Faulted) {
        res.status(400);
        res.send(getResponseFailed(`Job already started: ${id}`));
        return
      }
    }

    const deleteStatus = await jobCache.delete(id, true);
    if (deleteStatus == AgingCacheWriteStatus.Success) {
      return startJob(id, req, res);
    }

    res.status(500);
    res.send(
      getResponseFailed(`Error removing stale job from cache: ${id}`));
  };

  const webSocketConnectedHandler = (ws: WebSocket): void => {
    ws.on("message", (message) => {
      let data: IJobIdParams;
      try {
        data = JSON.parse(message.toString());
      } catch (e) {
        const response = getResponseFailed("Message was not valid JSON");
        ws.send(JSON.stringify(response));
        return;
      }

      if (!data.id) {
        const response = getResponseFailed("id: required");
        ws.send(JSON.stringify(response));
        return;
      }

      jobCache.get(data.id).then((job: IJob | null) => {
        if (!job) {
          const response = getResponseFailed(`No job exist for the specified ID: ${data.id}`);
          return ws.send(JSON.stringify(response));
        }

        const response = getResponseSuccess(job.status().progress);
        ws.send(JSON.stringify(response));
      })
    });
  };

  router.get("/", getCachedJobIdsHandler);
  router.get("/:id", getJobByIdHandler);
  router.post("/", postJobByIdHandler);
  router.ws("/job/progress", webSocketConnectedHandler);

  return router;
};
