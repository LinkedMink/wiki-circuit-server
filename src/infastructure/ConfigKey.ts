export enum ConfigKey {
  ListenPort = "LISTEN_PORT",
  LogFile = "LOG_FILE",
  LogLevel = "LOG_LEVEL",

  JwtAudience = "JWT_AUDIENCE",
  JwtIssuer = "JWT_ISSUER",
  JwtSecretKeyFile = "JWT_SECRET_KEY_FILE",
  JwtSigningAlgorithm = "JWT_SIGNING_ALGORITHM",

  RedisMode = "REDIS_MODE",
  RedisHosts = "REDIS_HOSTS",
  RedisKeyPrefix = "REDIS_KEY_PREFIX",

  JobCacheKeepMinutes = "JOB_CACHE_KEEP_MINUTES",
  JobCacheMaxEntries = "JOB_CACHE_MAX_ENTRIES",
  JobProgressReportThreshold = "JOB_PROGRESS_REPORT_THRESHOLD",
  JobMaxDepth = "JOB_MAX_DEPTH",
  JobMaxParallelDownloads = "JOB_MAX_PARALLEL_DOWNLOADS",
  JobUserAgent = "JOB_USER_AGENT",
}

export const configDefaultMap: Map<ConfigKey, string | undefined> = new Map([
  [ConfigKey.ListenPort, "8080"],
  [ConfigKey.LogFile, "combined.log"],
  [ConfigKey.LogLevel, "info"],

  [ConfigKey.JwtSigningAlgorithm, "RS256"],

  [ConfigKey.RedisMode, "Single"],
  [ConfigKey.RedisHosts, JSON.stringify({ host: "localhost", port: 6379 })],
  [ConfigKey.RedisKeyPrefix, "wiki-circuit"],

  [ConfigKey.JobCacheKeepMinutes, "120"],
  [ConfigKey.JobCacheMaxEntries, "30"],
  [ConfigKey.JobProgressReportThreshold, "0.05"],
  [ConfigKey.JobMaxDepth, "3"],
  [ConfigKey.JobMaxParallelDownloads, "10"],
  [
    ConfigKey.JobUserAgent,
    "wiki-circuit-server/1.2 (https://github.com/LinkedMink/wiki-circuit-server) node-fetch/2.0",
  ],
]);
