import { Logger } from "./Logger";
import { getResponseObject, ResponseStatus } from "./Models/IResponseData";
import { CORS_ERROR } from "./Cors";
import { ErrorRequestHandler, NextFunction } from "express";
import { ParamsDictionary, Request, Response } from "express-serve-static-core";
import { isError } from "./Shared/Core";

const logger = Logger.get("Error");

export class UserInputError extends Error {
  private inputErrorValue: boolean;

  constructor(message: string) {
    super(message);
    this.inputErrorValue = true;
  }

  get inputError(): boolean {
    return this.inputErrorValue;
  }

  static isThisType(error: Error): error is UserInputError {
    return (error as UserInputError).inputError !== undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware: ErrorRequestHandler = (error: unknown, req: Request<ParamsDictionary>, res: Response, next: NextFunction) => {
  if (isError(error)) {
    logger.error(error.message);
    if (error.stack) {
      logger.error(error.stack);
    }

    if (UserInputError.isThisType(error)) {
      res.status(400);
      return res.send(getResponseObject(ResponseStatus.Failed, error.message));
    } else if (error.message === CORS_ERROR) {
      res.status(401);
      return res.send(getResponseObject(ResponseStatus.Failed, error.message));
    }

  } else if (typeof error === "string" || error instanceof String) {
    logger.error(error);
  }

  res.status(500);
  return res.send(getResponseObject(ResponseStatus.Failed));
};
