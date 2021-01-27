import bodyParser from "body-parser";
import express from "express";
import expressWs from "express-ws";

import { config, ConfigKey } from "./Config";
import { corsMiddleware } from "./Cors";
import { errorMiddleware } from "./Error";
import { pingRouter } from "./Routes/PingRouter";
import { getArticleJobRouter } from "./Routes/GetArticleJobRouter";
import { executeOnExit } from "./Cleanup";
import { getRequestLoggerHandler, initLogger } from "./Logger";

initLogger();

const JOB_BASE_PATH = "/article";

const app = express();
expressWs(app);

app.use(getRequestLoggerHandler());
app.use(bodyParser.json());

app.use(corsMiddleware);
app.use(errorMiddleware);

app.use("/", pingRouter);

const handlers = getArticleJobRouter();
app.use(JOB_BASE_PATH, handlers.router);
executeOnExit(handlers.exitHandler);

const listenPort = config.getNumber(ConfigKey.ListenPort);
export const server = app.listen(listenPort);
