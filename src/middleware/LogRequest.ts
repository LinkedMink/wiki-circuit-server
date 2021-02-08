import { NextFunction, Request, RequestHandler, Response } from "express";
import path from "path";
import { Logger } from "../infastructure/Logger";

export const logRequestMiddleware = (): RequestHandler => {
  const logger = Logger.get(path.basename(__filename));

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    logger.http(`Start ${req.method} ${req.originalUrl}`);

    next();

    const elapsed = Date.now() - start;
    logger.http(`Ended ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsed} ms`);
  };
};
