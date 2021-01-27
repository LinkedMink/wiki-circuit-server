import {
  AgingCacheWriteMode,
  AgingCacheReplacementPolicy,
  IAgingCacheOptions,
  MemoryStorageProvider,
  StorageHierarchy,
  createAgingCache,
} from "@linkedmink/multilevel-aging-cache";

import { config, ConfigKey } from "../Config";
import { ArticleJobWork } from "../Article/ArticleJobWork";
import { getJobRouter } from "./GetJobRouter";
import { IJob, JobStatus } from "../Shared/JobInterfaces";
import { createRedisStorageProvider } from "../CreateRedis";
import { Router } from "express";
import { ExitFunction } from "../Cleanup";

const getExitHandler = (
  memoryStorageProvider: MemoryStorageProvider<string, IJob>
): ExitFunction => {
  return async () => {
    const keys = await memoryStorageProvider.keys();

    const stoppingJobs: Promise<void>[] = [];
    keys.forEach(key => {
      const stopPromise = memoryStorageProvider.get(key).then(keyValue => {
        if (keyValue === null) {
          return;
        }

        const status = keyValue.value.status().status;
        if (status === JobStatus.Running) {
          return keyValue.value.stop();
        }
      });

      stoppingJobs.push(stopPromise);
    });

    return Promise.all(stoppingJobs).then(() => 0);
  };
};

interface IArticleHandler {
  router: Router;
  exitHandler: ExitFunction;
}

export const getArticleJobRouter = (): IArticleHandler => {
  const memoryStorageProvider = new MemoryStorageProvider<string, IJob>();
  const redisStorageProvider = createRedisStorageProvider();
  const storageHierarchy = new StorageHierarchy([
    memoryStorageProvider,
    redisStorageProvider,
  ]);

  const agingCacheOptions = {
    maxEntries: config.getNumber(ConfigKey.JobCacheMaxEntries),
    ageLimit: config.getNumber(ConfigKey.JobCacheKeepMinutes),
    replacementPolicy: AgingCacheReplacementPolicy.FIFO,
    setMode: AgingCacheWriteMode.OverwriteAged,
    deleteMode: AgingCacheWriteMode.OverwriteAged,
  } as IAgingCacheOptions;

  const jobCache = createAgingCache(storageHierarchy, agingCacheOptions);

  return {
    router: getJobRouter(jobCache, () => new ArticleJobWork()),
    exitHandler: getExitHandler(memoryStorageProvider),
  };
};
