import { Logger as CacheLogger } from "@linkedmink/multilevel-aging-cache";
import { format, Logger as WinstonLogger, LoggerOptions, loggers, transports } from "winston";
import TransportStream from "winston-transport";

import { config } from "./Config";
import { ConfigKey } from "./ConfigKey";

/**
 * Expose the logger options, so that output can be customized
 */
export class Logger {
  static GlobalLabel = "AppGlobal";

  static get optionsFunc(): (label: string) => LoggerOptions {
    return Logger.optionsFuncVal;
  }

  /**
   * Change the options before constructing a logger. A logger will use the options
   * set at the time the first get() is called for a specific label
   */
  static set optionsFunc(options: (label: string) => LoggerOptions) {
    Logger.optionsFuncVal = options;
    CacheLogger.options = options(Logger.GlobalLabel);
  }

  /**
   * Wrap the Winston logger container, so we can get the same logger for each module.
   * @param label The label of the module we're logging
   * @return An instance of the logger
   */
  static get(label: string = Logger.GlobalLabel): WinstonLogger {
    if (!loggers.has(label)) {
      loggers.add(label, Logger.optionsFuncVal(label));
    }

    return loggers.get(label);
  }

  private static optionsFuncVal: (label: string) => LoggerOptions;
}

/**
 * Should execute this as the first operation, so that any instances will be constructed with the specified options
 */
export const initializeLogger = (): void => {
  const getLoggerOptions = (label: string): LoggerOptions => {
    const combined = format.combine(
      format.errors({ stack: true }),
      format.colorize(),
      format.label({ label, message: false }),
      format.timestamp(),
      format.printf(info => {
        const label = info.label ? ` ${info.label}` : "";
        const message = info.stack ? (info.stack as string) : info.message;
        return `${info.timestamp} ${info.level}${label}: ${message}`;
      })
    );

    const outputs: TransportStream[] = [];
    if (!config.isEnvironmentUnitTest) {
      outputs.push(
        new transports.Console({
          format: combined,
        })
      );
    }

    if (!config.isEnvironmentContainerized) {
      outputs.push(
        new transports.File({
          filename: config.getString(ConfigKey.LogFile),
          format: combined,
        })
      );
    }

    return {
      level: config.getString(ConfigKey.LogLevel),
      transports: outputs,
    } as LoggerOptions;
  };

  Logger.optionsFunc = getLoggerOptions;

  const logger = Logger.get("unhandledRejection");
  process.on("unhandledRejection", (error, p) => {
    if (error) {
      logger.error({ message: error });
    }
  });

  Logger.get().verbose("Logger Initialized");
};
