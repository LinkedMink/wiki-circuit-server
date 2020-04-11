import { 
  RedisStorageProvider,
  IRedisStorageProviderOptions,
  StringSerializer
} from "@linkedmink/multilevel-aging-cache";
import Redis from "ioredis";

import { config, ConfigKey } from "./Config";
import { JobSerializer } from "./Shared/JobSerializer";
import { IJob } from "./Shared/JobInterfaces";

export enum RedisMode {
  Single = "Single",
  Sentinel = "Sentinel",
  Cluster = "Cluster"
}

interface ISentinelGroup {
  sentinels: [{ host: string; port: number }];
  name: string;
}

const createRedisClient = () => {
  const hosts = config.getJson(ConfigKey.RedisHosts);
  const stringMode = config.getString(ConfigKey.RedisMode);
  const mode = stringMode as RedisMode;

  if (mode === RedisMode.Single) {
    return new Redis(hosts.port, hosts.host);
  } else if (mode === RedisMode.Sentinel) {
    const group = hosts as ISentinelGroup
    return new Redis(group); 
  } /* else if (mode === RedisMode.Cluster) {
    const hostArray = hosts as [{ host: string; port: number }]
    return new Redis.Cluster(hostArray);
  } */ else {
    throw Error(`Unsupported RedisMode: ${stringMode}; Can be Single, Sentinel, or Cluster`);
  }
}

export const createRedisStorageProvider = () => {
  const redisClient = createRedisClient();
  const redisChannel = createRedisClient();
  const redisOptions = {
    keyPrefix: config.getString(ConfigKey.RedisKeyPrefix),
    keySerializer: new StringSerializer(),
    valueSerializer: new JobSerializer()
  } as IRedisStorageProviderOptions<string, IJob>

  return new RedisStorageProvider(redisClient, redisOptions, redisChannel);
}
