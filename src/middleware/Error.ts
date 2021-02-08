import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import path from "path";
import { Logger } from "../infastructure/Logger";
import { response, ResponseStatus } from "../models/responses/IResponseData";
import { isError, isOpenApiValidationError } from "../infastructure/TypeCheck";

export const getErrorMiddleware = (): ErrorRequestHandler => {
  const logger = Logger.get(path.basename(__filename));

  const errorMiddleware: ErrorRequestHandler = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    logger.error({ message: error as Error });

    if (isError(error)) {
      if (isOpenApiValidationError(error)) {
        res.send(error.data);
        res.status(400);
        return res.send(response.get(ResponseStatus.Failed, error.message));
      }
    }

    res.status(500);
    return res.send(response.get(ResponseStatus.Failed));
  };

  return errorMiddleware;
};
