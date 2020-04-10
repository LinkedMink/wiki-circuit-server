import bodyParser from "body-parser";
import express from "express";
import expressWs from "express-ws";
import morgan from "morgan";
import { 
  AgingCacheWriteMode, 
  AgingCacheReplacementPolicy, 
  IAgingCacheOptions, 
  MemoryStorageProvider, 
  StorageHierarchy, 
  createAgingCache 
} from "multilevel-aging-cache";

import { ArticleJobWork } from "./Article/ArticleJobWork";
import { config, ConfigKey } from "./Config";
import { corsMiddleware } from "./Cors";
import { errorMiddleware } from "./Error";
import { getJobRouter } from "./Routes/GetJobRouter";
import { getResponseObject } from "./Shared/Response";
import { IJob } from "./Shared/JobInterfaces";
import { createRedisStorageProvider } from "./CreateRedis";

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

const memoryStorageProvider = new MemoryStorageProvider<string, IJob>();
const redisStorageProvider = createRedisStorageProvider();
const storageHierarchy = new StorageHierarchy([
  memoryStorageProvider,
  redisStorageProvider
]);

const agingCacheOptions = {
  maxEntries: config.getNumber(ConfigKey.JobCacheMaxEntries),
  ageLimit: config.getNumber(ConfigKey.JobCacheKeepMinutes),
  replacementPolicy: AgingCacheReplacementPolicy.FIFO,
  setMode: AgingCacheWriteMode.OverwriteAged,
  deleteMode: AgingCacheWriteMode.OverwriteAged,
} as IAgingCacheOptions;

const jobCache = createAgingCache(storageHierarchy, agingCacheOptions);

app.use(JOB_BASE_PATH, getJobRouter(jobCache, () => new ArticleJobWork()));

export const server = app.listen(config.getString(ConfigKey.ListenPort));
