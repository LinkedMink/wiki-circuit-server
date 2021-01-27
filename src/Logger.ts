import { Logger as CacheLogger } from "@linkedmink/multilevel-aging-cache";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import winston, { LoggerOptions } from "winston";
import TransportStream from "winston-transport";

import { config, ConfigKey } from "./Config";

/**
 * Expose the logger constructor, so that output can be customized
 */
export class Logger {
  static GLOBAL_LABEL = "AppGlobalLogger";

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
  }

  private static optionsValue: LoggerOptions;
}

export const getRequestLoggerHandler = (): RequestHandler => {
  const logger = Logger.get("Request");

  return (
    req: Request<ParamsDictionary>,
    res: Response,
    next: NextFunction
  ): void => {
    const start = Date.now();
    logger.http(`Start ${req.method} ${req.url}`);

    next();

    const elapsed = Date.now() - start;
    logger.http(
      `Ended ${req.method} ${req.url} ${res.statusCode} ${elapsed} ms`
    );
  };
};

const initLogger = (): void => {
  const transports: TransportStream[] = [];
  const format = winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.label(),
    winston.format.timestamp(),
    winston.format.printf(info => {
      const label = info.label ? ` ${info.label}` : "";
      const stack = (info.stackv as string) ?? "";
      return `${info.timestamp} ${info.level}${label}: ${info.message}${stack}`;
    })
  );

  if (!config.isEnvironmentUnitTest) {
    transports.push(
      new winston.transports.Console({
        format,
      })
    );
  }

  if (!config.isEnvironmentContainerized) {
    transports.push(
      new winston.transports.File({
        filename: config.getString(ConfigKey.LogFile),
        format,
      })
    );
  }

  const options = {
    level: config.getString(ConfigKey.LogLevel),
    // defaultMeta: { service: config.packageJson.name, version: config.packageJson.version },
    transports,
  } as LoggerOptions;

  Logger.options = options;

  process.on("unhandledRejection", (reason, p) => {
    const logger = Logger.get();

    let errorMessage = `Unhandled Promise Rejection`;

    const error = reason as Error;
    if (error.message) {
      errorMessage += `, message: ${error.message}`;
    }

    if (error.stack) {
      errorMessage += `, stack: ${error.stack}`;
    }

    logger.error(errorMessage);
  });
};

export { initLogger };
