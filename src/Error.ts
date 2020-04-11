import { CORS_ERROR } from "./Cors";
import { Logger } from "./Logger";
import { getResponseObject, ResponseStatus } from "./Shared/IResponseData";

const logger = Logger.get("errorMiddleware");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware = (error: any, req: any, res: any, next: any) => {
  if (error && error.stack) {
    if (error.stack) {
      logger.error(error.stack);
    } else if (error.message) {
      logger.error(error.message);
    }
  }

  if (error && error.message === CORS_ERROR) {
    res.status(401);
    res.send(getResponseObject(ResponseStatus.Failed, error.message));
  }
};
