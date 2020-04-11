import { 
  AgingCacheWriteMode, 
  AgingCacheReplacementPolicy, 
  IAgingCacheOptions, 
  MemoryStorageProvider, 
  StorageHierarchy, 
  createAgingCache 
} from "multilevel-aging-cache";

import { config, ConfigKey } from "../Config";
import { ArticleJobWork } from "../Article/ArticleJobWork";
import { getJobRouter } from "./GetJobRouter";
import { IJob } from "../Shared/JobInterfaces";
import { createRedisStorageProvider } from "../CreateRedis";

export const getArticleJobRouter = () => {
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

  return getJobRouter(jobCache, () => new ArticleJobWork());
}
