import { Router } from "express";
import { ParamsDictionary, Request, Response } from "express-serve-static-core";

import { config, Environment } from "../Config";
import { getResponseObject } from "../Shared/IResponseData";

export const pingRouter = Router();

/**
 * @swagger
 * definitions:
 *   PingMark:
 *     type: object
 *     properties:
 *       mark:
 *         type: integer
 *       application:
 *         type: string
 *       version:
 *         type: string
 *   PingSuccessResponse:
 *     type: object
 *     properties:
 *       status:
 *         type: integer
 *       data:
 *         type: object
 *         schema:
 *           $ref: '#/definitions/PingMark'
 *
 * /ping:
 *   get:
 *     description: Get a response to determine if the service is running
 *     tags: [Ping]
 *     responses:
 *       200:
 *         description: The package name and version that's running this service
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/PingSuccessResponse'
 */
pingRouter.get("/", (req: Request<ParamsDictionary, any, any>, res: Response) => {
  const pingResponse = getResponseObject();

  if (process.env.NODE_ENV === Environment.Production) {
    pingResponse.data = {
      mark: Date.now(),
      application: config.packageJson.name,
    };
  } else {
    pingResponse.data = {
      mark: Date.now(),
      application: config.packageJson.name,
      version: config.packageJson.version,
    };
  }

  res.send(pingResponse);
});
