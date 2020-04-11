import { Logger as CacheLogger } from "@linkedmink/multilevel-aging-cache";
import winston, { LoggerOptions } from "winston";
import TransportStream from 'winston-transport'

import { config, ConfigKey } from "./Config";

/**
 * Expose the logger constructor, so that output can be customized
 */
export class Logger {
  static GLOBAL_LABEL = "AppGlobalLogger"

  static get options(): LoggerOptions {
    return Logger.optionsValue;
  }

  /**
   * Change the options before constructing a logger. A logger will use the options
   * set at the time the first get() is called for a specific label 
   */
  static set options(options: LoggerOptions) {
    Logger.optionsValue = options;
    CacheLogger.options = options;
  }

  /**
   * Wrap the Winston logger container, so we can get the same logger for each module.
   * @param label The label of the module we're logging
   * @return An instance of the logger
   */
  static get(label: string = Logger.GLOBAL_LABEL): winston.Logger {
    if (!winston.loggers.has(label)) {
      winston.loggers.add(label, Logger.optionsValue);
    }

    return winston.loggers.get(label);
  };

  private static optionsValue: LoggerOptions;
}

const transports: TransportStream[] = []

if (!config.isEnvironmentUnitTest) {
  transports.push(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

if (!config.isEnvironmentContainerized) {
  transports.push(new winston.transports.File({ 
    filename: config.getString(ConfigKey.LogFile),
    format: winston.format.json() 
  }));
}

const options = {
  level: config.getString(ConfigKey.LogLevel),
  defaultMeta: { service: config.packageJson.name },
  transports,
} as LoggerOptions;

Logger.options = options

process.on("unhandledRejection", (reason, p) => {
  const logger = Logger.get();

  let errorMessage = `Unhandled Rejection at: Promise: ${p}`;

  const error = reason as Error;
  if (error.message) {
    errorMessage += `, message: ${error.message}`;
  }

  if (error.stack) {
    errorMessage += `, stack: ${error.stack}`;
  }

  logger.warn(errorMessage);
});
