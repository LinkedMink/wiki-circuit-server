import { 
  RedisStorageProvider,
  IRedisStorageProviderOptions,
  StringSerializer
} from "multilevel-aging-cache";
import Redis from "ioredis";

import { config, ConfigKey } from "./Config";
import { JobSerializer } from "./Shared/JobSerializer";
import { IJob } from "./Shared/JobInterfaces";

const DEFAULT_SENTINAL_GROUP_NAME = "defaultRedisGroup";

export enum RedisMode {
  Single = "Single",
  Sentinal = "Sentinal",
  Cluster = "Cluster"
}

const createRedisClient = () => {
  const hosts = config.getJson(ConfigKey.RedisHosts);
  const stringMode = config.getString(ConfigKey.RedisMode);
  const mode = stringMode as RedisMode;

  if (mode === RedisMode.Single) {
    return new Redis(hosts.port, hosts.name);
  } else if (mode === RedisMode.Sentinal) {
    const hostArray = hosts as [{ host: string; port: number }]
    return new Redis({
      sentinels: hostArray,
      name: DEFAULT_SENTINAL_GROUP_NAME
    }); 
  } /* else if (mode === RedisMode.Cluster) {
    const hostArray = hosts as [{ host: string; port: number }]
    return new Redis.Cluster(hostArray);
  } */ else {
    throw Error(`Unsupported RedisMode: ${stringMode}; Can be Single, Sentinal, or Cluster`);
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
