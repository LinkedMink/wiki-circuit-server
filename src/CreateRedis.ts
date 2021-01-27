import { StringSerializer } from "@linkedmink/multilevel-aging-cache";
import {
  RedisPubSubStorageProvider,
  IRedisStorageProviderOptions,
} from "@linkedmink/multilevel-aging-cache-ioredis";
import Redis from "ioredis";

import { config, ConfigKey } from "./Config";
import { JobSerializer } from "./Shared/JobSerializer";
import { IJob } from "./Shared/JobInterfaces";

export enum RedisMode {
  Single = "Single",
  Sentinel = "Sentinel",
  Cluster = "Cluster",
}

interface IHostPort {
  host: string;
  port: number;
}

interface ISentinelGroup {
  sentinels: IHostPort[];
  name: string;
}

const createRedisClient = (): Redis.Redis | Redis.Cluster => {
  const hosts = config.getJson(ConfigKey.RedisHosts);
  const stringMode = config.getString(ConfigKey.RedisMode);
  const mode = stringMode as RedisMode;

  if (mode === RedisMode.Single) {
    const hostPort = hosts as IHostPort;
    return new Redis(hostPort.port, hostPort.host);
  } else if (mode === RedisMode.Sentinel) {
    const group = hosts as ISentinelGroup;
    return new Redis(group);
  } else if (mode === RedisMode.Cluster) {
    const hostArray = hosts as IHostPort[];
    return new Redis.Cluster(hostArray);
  } else {
    throw Error(
      `Unsupported RedisMode: ${stringMode}; Can be Single, Sentinel, or Cluster`
    );
  }
};

export const createRedisStorageProvider = (): RedisPubSubStorageProvider<
  string,
  IJob
> => {
  const redisClient = createRedisClient();
  const redisChannel = createRedisClient();
  const redisOptions = {
    keyPrefix: config.getString(ConfigKey.RedisKeyPrefix),
    keySerializer: new StringSerializer(),
    valueSerializer: new JobSerializer(),
  } as IRedisStorageProviderOptions<string, IJob>;

  return new RedisPubSubStorageProvider(
    redisClient,
    redisOptions,
    redisChannel
  );
};
