import bodyParser from "body-parser";
import express from "express";

import { config } from "./infastructure/Config";
import { ConfigKey } from "./infastructure/ConfigKey";
import { initializeLogger, Logger } from "./infastructure/Logger";
import { getErrorMiddleware } from "./middleware/Error";
import { logRequestMiddleware } from "./middleware/LogRequest";
import { getOpenApiRouter } from "./routes/OpenApiRouter";
import { pingRouter } from "./routes/PingRouter";

initializeLogger();

const app = express();

app.use(logRequestMiddleware());
app.use(bodyParser.json());

app.use("/", pingRouter);
app.use(getErrorMiddleware());

void getOpenApiRouter()
  .then(router => {
    app.use("/docs", router);
    Logger.get().info("Swagger UI Path: /docs");
  })
  .catch(error => {
    Logger.get().info("Swagger Disabled");
    Logger.get().verbose({ message: error as Error });
  });

const listenPort = config.getNumber(ConfigKey.ListenPort);
export const server = app.listen(listenPort);
