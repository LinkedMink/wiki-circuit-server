export enum ConfigKey {
  ListenPort = "LISTEN_PORT",
  LogFile = "LOG_FILE",
  LogLevel = "LOG_LEVEL",

  ServiceUsername = "SERVICE_USERNAME",
  ServiceKeyFile = "SERVICE_KEY_FILE",

  JwtAudience = "JWT_AUDIENCE",
  JwtIssuer = "JWT_ISSUER",
  JwtPublicKeyFile = "JWT_SECRET_KEY_FILE",
  JwtSigningAlgorithm = "JWT_SIGNING_ALGORITHM",

  RedisMode = "REDIS_MODE",
  RedisHosts = "REDIS_HOSTS",
  RedisKeyPrefix = "REDIS_KEY_PREFIX",

  UserServiceUrl = "USER_SERVICE_URL",
  SchedulerServiceUrl = "SCHEDULER_SERVICE_URL",

  TaskRunningLimit = "TASK_RUNNING_LIMIT",
  TaskProgressReportThreshold = "TASK_PROGRESS_REPORT_THRESHOLD",
  TaskMaxParallelDownloads = "TASK_MAX_PARALLEL_DOWNLOADS",
  TaskUserAgent = "TASK_USER_AGENT",
}

export const configDefaultMap: Map<ConfigKey, string | undefined> = new Map([
  [ConfigKey.ListenPort, "8080"],
  [ConfigKey.LogFile, "combined.log"],
  [ConfigKey.LogLevel, "info"],

  [ConfigKey.ServiceUsername, "wiki-circuit-processor@linkedmink.space"],

  [ConfigKey.JwtAudience, "service.localhost"],
  [ConfigKey.JwtIssuer, "auth.localhost"],
  [ConfigKey.JwtPublicKeyFile, "jwtRS256.key.pub"],
  [ConfigKey.JwtSigningAlgorithm, "RS256"],

  [ConfigKey.RedisMode, "Single"],
  [ConfigKey.RedisHosts, JSON.stringify({ host: "localhost", port: 6379 })],
  [ConfigKey.RedisKeyPrefix, "wiki-circuit"],

  [ConfigKey.TaskRunningLimit, "4"],
  [ConfigKey.TaskProgressReportThreshold, "0.02"],
  [ConfigKey.TaskMaxParallelDownloads, "10"],
  [
    ConfigKey.TaskUserAgent,
    "wiki-circuit-server/1.2 (https://github.com/LinkedMink/wiki-circuit-server) node-fetch/2.0",
  ],
]);
