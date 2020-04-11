import fs from "fs";

export enum Environment {
  Local = "local",
  UnitTest = "unitTest",
  Development = "development",
  Production = "production",
}

export enum ConfigKey {
  AllowedOrigins = "ALLOWED_ORIGINS",
  ListenPort = "LISTEN_PORT",
  LogFile = "LOG_FILE",
  LogLevel = "LOG_LEVEL",
  JobMaxDepth = "JOB_MAX_DEPTH",
  JobMaxParallelDownloads = "JOB_MAX_PARALLEL_DOWNLOADS",
  JobCacheKeepMinutes = "JOB_CACHE_KEEP_MINUTES",
  JobCacheMaxEntries = "JOB_CACHE_MAX_ENTRIES",
  RedisMode = "REDIS_MODE",
  RedisHosts = "REDIS_HOSTS",
  RedisKeyPrefix = "REDIS_KEY_PREFIX",
}

const configDefaultMap: Map<ConfigKey, string | undefined> = new Map([
  [ConfigKey.AllowedOrigins, "*"],
  [ConfigKey.ListenPort, "8080"],
  [ConfigKey.LogFile, "combined.log"],
  [ConfigKey.LogLevel, "info"],
  [ConfigKey.JobMaxDepth, "3"],
  [ConfigKey.JobMaxParallelDownloads, "10"],
  [ConfigKey.JobCacheKeepMinutes, "360"],
  [ConfigKey.JobCacheMaxEntries, "30"],
  [ConfigKey.RedisMode, "Single"],
  [ConfigKey.RedisHosts, JSON.stringify({host: "localhost", port: 6379})],
  [ConfigKey.RedisKeyPrefix, "wiki-circuit"],
]);

export class EnvironmentalConfig {
  private fileBuffers: Map<ConfigKey, Buffer> = new Map();
  private jsonObjects: Map<ConfigKey, { [key: string]: any }> = new Map();
  private packageJsonValue: { [key: string]: any };

  constructor() {
    // const filePath = isEnvironmentLocal ? "../package.json" : "./package.json";
    const filePath = "./package.json";
    const data = fs.readFileSync(filePath, "utf8");
    this.packageJsonValue = JSON.parse(data);
  }

  public get isEnvironmentLocal(): boolean {
    return !process.env.NODE_ENV || process.env.NODE_ENV === Environment.Local;
  }

  public get isEnvironmentUnitTest(): boolean {
    return process.env.NODE_ENV === Environment.UnitTest;
  }

  public get isEnvironmentContainerized(): boolean {
    return process.env.IS_CONTAINER_ENV !== undefined && 
      process.env.IS_CONTAINER_ENV.trim().toLowerCase() === 'true';
  }

  public get packageJson(): { [key: string]: any } {
    return this.packageJsonValue;
  }

  public getString = (key: ConfigKey) => {
    return this.getConfigValue(key);
  }

  public getNumber = (key: ConfigKey) => {
    const value = this.getConfigValue(key);
    return Number(value);
  }

  public getBool = (key: ConfigKey) => {
    const value = this.getConfigValue(key);
    return value.trim().toLowerCase() === "true";
  }

  public getJsonOrString = (key: ConfigKey) => {
    const json = this.jsonObjects.get(key);
    if (json) {
      return json;
    }

    const value = this.getConfigValue(key).trim();
    if (value.length > 0 && (value.startsWith("{") || value.startsWith("["))) {
      return this.getJson(key);
    }

    return value;
  }

  public getJson = (key: ConfigKey) => {
    const json = this.jsonObjects.get(key);
    if (json) {
      return json;
    }

    const value = this.getConfigValue(key);
    const parsed = JSON.parse(value) as { [key: string]: any };
    this.jsonObjects.set(key, parsed);
    return parsed;
  }

  public getFileBuffer = (key: ConfigKey) => {
    const buffer = this.fileBuffers.get(key);
    if (buffer) {
      return buffer;
    }

    if (process.env.NODE_ENV === Environment.UnitTest) {
      return Buffer.alloc(0);
    }

    const filePath = this.getConfigValue(key);
    const data = fs.readFileSync(filePath);
    this.fileBuffers.set(key, data);
    return data;
  }

  private getConfigValue = (key: ConfigKey): string => {
    let configValue = process.env[key];
    if (configValue) {
      return configValue;
    }

    configValue = configDefaultMap.get(key);
    if (configValue !== undefined) {
      return configValue;
    }

    throw new Error(`Environmental variable must be defined: ${key}`);
  }
}

export const config = new EnvironmentalConfig();
