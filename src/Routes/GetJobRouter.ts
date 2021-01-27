import express, { Request, Response, Router } from "express";
import path from "path";
import {
  IAgingCache,
  AgingCacheWriteStatus,
} from "@linkedmink/multilevel-aging-cache";
import WebSocket from "ws";

import { Job } from "../Shared/Job";
import { JobStatus, IJobWork, IJob } from "../Shared/JobInterfaces";
import { getResponseFailed, getResponseSuccess } from "../Models/IResponseData";
import {
  IJobIdParams,
  isIJobIdParams,
  isIJobStartParams,
} from "../Models/IJobParameters";
import { config, ConfigKey } from "../Config";
import { Logger } from "../Logger";

const MAX_CACHE_MS =
  config.getNumber(ConfigKey.JobCacheKeepMinutes) * 60 * 1000;

export const getJobRouter = (
  jobCache: IAgingCache<string, IJob>,
  createWork: () => IJobWork
): Router => {
  const logger = Logger.get(path.basename(__filename));

  const router = express.Router();

  const jobProgressUpdater = (job: IJob): void => {
    const id = job.status().id;
    void jobCache.set(id, job, true);
  };

  const startJob = async (
    id: string,
    req: Request,
    res: Response
  ): Promise<void> => {
    const newJob = new Job(id, createWork(), jobProgressUpdater);
    newJob.start(req.body);

    const status = await jobCache.set(id, newJob);
    if (status === AgingCacheWriteStatus.Success) {
      res.send(getResponseSuccess(`Job started: ${id}`));
      return;
    }

    res.status(500);
    res.send(getResponseFailed(`Failed to store job: ${id}`));
  };

  const getCachedJobIdsHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const keys = await jobCache.keys();

    const response = getResponseSuccess(keys);
    res.send(response);
  };

  const getJobByIdHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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
      return;
    }

    const data = job.status();
    const result = job.result();
    if (result) {
      data.result = result;
    }

    res.send(getResponseSuccess(data));
  };

  const postJobByIdHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const params = req.body as unknown;

    if (!isIJobStartParams(params)) {
      res.status(400);
      res.send(getResponseFailed("id: required"));
      return;
    }

    const job = await jobCache.get(params.id);
    if (!job) {
      return startJob(params.id, req, res);
    }

    const jobState = job.status();
    if (!params.refresh && Date.now() < jobState.endTime + MAX_CACHE_MS) {
      logger.debug(JSON.stringify(jobState));

      if (jobState.status === JobStatus.Complete) {
        res.status(400);
        res.send(
          getResponseFailed(`Job already completed and cached: ${params.id}`)
        );
        return;
      }

      if (jobState.status !== JobStatus.Faulted) {
        res.status(400);
        res.send(getResponseFailed(`Job already started: ${params.id}`));
        return;
      }
    }

    const deleteStatus = await jobCache.delete(params.id, true);
    if (
      deleteStatus == AgingCacheWriteStatus.Success ||
      deleteStatus == AgingCacheWriteStatus.PartialWrite
    ) {
      return startJob(params.id, req, res);
    }

    res.status(500);
    res.send(
      getResponseFailed(`Error removing stale job from cache: ${params.id}`)
    );
  };

  const webSocketConnectedHandler = (ws: WebSocket): void => {
    ws.on("message", message => {
      let data: IJobIdParams;
      try {
        const parsed = JSON.parse(message.toString()) as unknown;
        if (isIJobIdParams(parsed)) {
          data = parsed;
        } else {
          const response = getResponseFailed("id: required");
          ws.send(JSON.stringify(response));
          return;
        }
      } catch (e) {
        const response = getResponseFailed("Message was not valid JSON");
        ws.send(JSON.stringify(response));
        return;
      }

      void jobCache.get(data.id).then((job: IJob | null) => {
        if (!job) {
          const response = getResponseFailed(
            `No job exist for the specified ID: ${data.id ? data.id : ""}`
          );
          return ws.send(JSON.stringify(response));
        }

        const response = getResponseSuccess(job.status().progress);
        ws.send(JSON.stringify(response));
      });
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get("/", getCachedJobIdsHandler);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.get("/:id", getJobByIdHandler);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post("/", postJobByIdHandler);
  router.ws("/job/progress", webSocketConnectedHandler);

  return router;
};
