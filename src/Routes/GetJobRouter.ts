import express, { Request, Response } from "express";
import { IAgingCache } from "multilevel-aging-cache";
import WebSocket from "ws";

import { Job } from "../Shared/Job";
import { JobStatus, JobWork, IJob } from "../Shared/JobInterfaces";
import { getResponseObject, ResponseStatus } from "../Shared/Response";
//import { logger } from "../Logger";

interface IIdParams {
  id?: string;
}

export const getJobRouter = (jobCache: IAgingCache<string, IJob>, createWork: () => JobWork) => {
  const router = express.Router();

  const getCachedJobIdsHandler = (req: Request, res: Response) => {
    const response = getResponseObject();

    return jobCache.keys().then((keys: string[]) => {
      response.data = keys;
      return res.send(response);
    })
  };

  const getJobByIdHandler = (req: Request, res: Response) => {
    const response = getResponseObject();

    const id = req.params.id;
    if (!id) {
      response.status = ResponseStatus.Failed;
      response.message = "id: required";
      res.status(400);
      return res.send(response);
    }

    return jobCache.get(id).then((job: IJob | null) => {
      if (job === null) {
        response.status = ResponseStatus.Failed;
        response.message = `No job exist for the specified ID: ${id}`;
        res.status(404);
        return res.send(response);
      }

      response.data = job.status();
      const result = job.result();
      if (result) {
        (response.data as any).result = result;
      }

      return res.send(response);
    })
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

    const startJob = () => {
      const newJob = new Job(id, createWork());
      jobCache.set(id, newJob);
      newJob.start(req.body);
  
      response.message = `Job started: ${id}`;
      return res.send(response);
    }

    jobCache.get(id).then((job: IJob | null) => {
      if (!job) {
        return startJob();
      }

      if (job.status().status === JobStatus.Complete) {
        response.status = ResponseStatus.Failed;
        response.message = `Job already completed and cached: ${id}`;
        res.status(400);
        return res.send(response);
      }

      if (job.status().status !== JobStatus.Faulted) {
        response.status = ResponseStatus.Failed;
        response.message = `Job already started: ${id}`;
        res.status(400);
        return res.send(response);
      }

      jobCache.delete(id).then(startJob);
    })
  };

  const webSocketConnectedHandler = (ws: WebSocket) => {
    ws.on("message", (message) => {
      const response = getResponseObject();

      let data: IIdParams;
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

      jobCache.get(data.id).then((job: IJob | null) => {
        if (!job) {
          response.status = ResponseStatus.Failed;
          response.message = `No job exist for the specified ID: ${data.id}`;
          return ws.send(JSON.stringify(response));
        }

        response.data = job.status().progress;
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
