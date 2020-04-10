import bodyParser from "body-parser";
import express from "express";
import expressWs from "express-ws";
import morgan from "morgan";
import Redis from "ioredis";

import { ArticleJobWork } from "./Article/articleJobWork";
import { config, ConfigKey } from "./config";
import { corsMiddleware } from "./cors";
import { errorMiddleware } from "./error";
import { getJobRouter } from "./Routes/getJobRouter";
import { getResponseObject } from "./Shared/response";
import { AgingCache } from "./Shared/agingCache";
//import { MemoryAgingCache } from "./Shared/memoryAgingCache";
import { TwoLevelRedisCache } from "./Shared/twoLevelRedisCache";
import { JobSerializer } from "./Shared/jobSerializer";
import { IJob } from "./Shared/jobInterfaces";
import { createRedis } from "./createRedis";

const JOB_BASE_PATH = "/article";

const app = express();
expressWs(app);

app.use(morgan("dev"));
app.use(bodyParser.json());

app.use(corsMiddleware);
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send(getResponseObject());
});

//const jobCache: AgingCache<string, Job> = new MemoryAgingCache<string, Job>(
//  config.getNumber(ConfigKey.JobCacheMaxEntries),
//  config.getNumber(ConfigKey.JobCacheKeepMinutes));

const redisClient = createRedis();
const jobCache: AgingCache<string, IJob> = new TwoLevelRedisCache<IJob>(
  redisClient,
  new JobSerializer(),
  config.getString(ConfigKey.RedisKeyPrefix),
  config.getNumber(ConfigKey.JobCacheMaxEntries),
  config.getNumber(ConfigKey.JobCacheKeepMinutes));

app.use(JOB_BASE_PATH, getJobRouter(jobCache, () => new ArticleJobWork()));

export const server = app.listen(config.getString(ConfigKey.ListenPort));
