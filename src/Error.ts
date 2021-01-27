import { ErrorRequestHandler, NextFunction } from "express";
import { ParamsDictionary, Request, Response } from "express-serve-static-core";
import path from "path";
import { Logger } from "./Logger";
import { getResponseObject, ResponseStatus } from "./Models/IResponseData";
import { CORS_ERROR } from "./Cors";
import { isError } from "./Shared/Core";

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

export const errorMiddleware: ErrorRequestHandler = (
  error: unknown,
  req: Request<ParamsDictionary>,
  res: Response,
  next: NextFunction
) => {
  const logger = Logger.get(path.basename(__filename));
  logger.error(error as Record<string, string>);

  if (isError(error)) {
    if (UserInputError.isThisType(error)) {
      res.status(400);
      return res.send(getResponseObject(ResponseStatus.Failed, error.message));
    } else if (error.message === CORS_ERROR) {
      res.status(401);
      return res.send(getResponseObject(ResponseStatus.Failed, error.message));
    }
  }

  res.status(500);
  return res.send(getResponseObject(ResponseStatus.Failed));
};
