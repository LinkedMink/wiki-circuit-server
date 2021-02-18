import bodyParser from "body-parser";
import express from "express";
import { getAxiosForService } from "./infastructure/Axios";

import { config } from "./infastructure/Config";
import { ConfigKey } from "./infastructure/ConfigKey";
import { CredentialStore } from "./infastructure/CredentialStore";
import { initializeLogger, Logger } from "./infastructure/Logger";
import { SocketFactory } from "./infastructure/Socket";
import { TaskService } from "./infastructure/TaskService";
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

const credStore = new CredentialStore();
void credStore.refresh().then(() => {
  const axios = getAxiosForService(config.getString(ConfigKey.SchedulerServiceUrl), credStore);
  const socket = new SocketFactory(config.getString(ConfigKey.SchedulerServiceUrl), credStore);
  const service = new TaskService(axios, socket);
  service.start();
});

const listenPort = config.getNumber(ConfigKey.ListenPort);
export const server = app.listen(listenPort);
