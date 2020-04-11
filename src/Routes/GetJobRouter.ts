import express, { Request, Response } from "express";
import { IAgingCache, AgingCacheWriteStatus } from "multilevel-aging-cache";
import WebSocket from "ws";

import { Job } from "../Shared/Job";
import { JobStatus, JobWork, IJob } from "../Shared/JobInterfaces";
import { getResponseFailed, getResponseSuccess } from "../Shared/IResponseData";
//import { logger } from "../Logger";

interface IIdParams {
  id?: string;
}

export const getJobRouter = (jobCache: IAgingCache<string, IJob>, createWork: () => JobWork) => {
  const router = express.Router();

  const getCachedJobIdsHandler = async (req: Request, res: Response) => {
    const keys = await jobCache.keys();

    const response = getResponseSuccess(keys);
    return res.send(response);
  };

  const getJobByIdHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!id) {
      res.status(400);
      return res.send(
        getResponseFailed("id: required"));
    }

    const job = await jobCache.get(id);

    if (job === null) {
      res.status(404);
      return res.send(
        getResponseFailed(`No job exist for the specified ID: ${id}`));
    }

    const data = job.status();
    const result = job.result();
    if (result) {
      data.result = result;
    }

    return res.send(getResponseSuccess(data));
  };

  const startJob = async (id: string, req: Request, res: Response) => {
    const newJob = new Job(id, createWork());
    newJob.start(req.body);

    const status = await jobCache.set(id, newJob);
    if (status === AgingCacheWriteStatus.Success) {
      return res.send(
        getResponseSuccess(`Job started: ${id}`));
    } 

    res.status(500)
    return res.send(
      getResponseFailed(`Failed to store job: ${id}`));
  }

  const postJobByIdHandler = async (req: Request, res: Response) => {
    const id = req.body.id;
    if (!id) {
      res.status(400);
      return res.send(
        getResponseFailed("id: required"));
    }

    const job = await jobCache.get(id);
    if (!job) {
      return startJob(id, req, res);
    }

    if (job.status().status === JobStatus.Complete) {
      res.status(400);
      return res.send(
        getResponseFailed(`Job already completed and cached: ${id}`));
    }

    if (job.status().status !== JobStatus.Faulted) {
      res.status(400);
      return res.send(
        getResponseFailed(`Job already started: ${id}`));
    }

    const deleteStatus = await jobCache.delete(id);
    if (deleteStatus == AgingCacheWriteStatus.Success) {
      return startJob(id, req, res);
    }

    res.status(500);
    return res.send(
      getResponseFailed(`Error removing stale job from cache: ${id}`));
  };

  const webSocketConnectedHandler = (ws: WebSocket) => {
    ws.on("message", (message) => {
      let data: IIdParams;
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
