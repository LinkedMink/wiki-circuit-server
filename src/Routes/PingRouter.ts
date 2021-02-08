import { Router } from "express";
import { Request, Response } from "express";

import { config } from "../infastructure/Config";
import { response } from "../models/responses/IResponseData";
import { IPingMark } from "../models/responses/IPingMark";

export const pingRouter = Router();

pingRouter.get("/", (req: Request, res: Response) => {
  if (config.isEnvironmentProd) {
    res.send(
      response.success<IPingMark>({
        mark: Date.now(),
      })
    );
  } else {
    res.send(
      response.success<IPingMark>({
        mark: Date.now(),
        application: config.packageJson.name,
        version: config.packageJson.version,
      })
    );
  }
});
