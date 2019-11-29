import cors from "cors";

import { config, ConfigKey } from "./config";

export const CORS_ERROR = "Not allowed by CORS";

const originsData = config.getJsonOrString(ConfigKey.AllowedOrigins);
const corsOptions = {
  origin: originsData as any,
  optionsSuccessStatus: 200,
};

if (originsData.length) {
  corsOptions.origin = (origin: string, callback: any) => {
    if (originsData.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error(CORS_ERROR));
    }
  };
}

export const corsMiddleware = cors(corsOptions);
