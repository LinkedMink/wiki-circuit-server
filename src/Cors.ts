import cors from "cors";

import { config, ConfigKey } from "./Config";
import { isString } from "./Shared/Core";

export const CORS_ERROR = "Not allowed by CORS";

type ReportOriginFunction = (err: Error | null, allow?: boolean) => void;
type OriginFunction = (
  requestOrigin: string | undefined,
  callback: ReportOriginFunction
) => void;

interface ICorsOptions {
  origin: string | OriginFunction;
  optionsSuccessStatus: number;
}

const originsData = config.getJsonOrString<string[]>(ConfigKey.AllowedOrigins);

let origin: string | OriginFunction
if (isString(originsData)) {
  origin = originsData;
} else {
  origin = (origin: string | undefined, callback: ReportOriginFunction): void => {
    if (origin !== undefined && originsData.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(CORS_ERROR));
    }
  };
}

const corsOptions: ICorsOptions = {
  origin,
  optionsSuccessStatus: 200,
};

export const corsMiddleware = cors(corsOptions);
