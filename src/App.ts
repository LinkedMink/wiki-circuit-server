import bodyParser from "body-parser";
import express from "express";
import expressWs from "express-ws";
import morgan from "morgan";

import { config, ConfigKey } from "./Config";
import { corsMiddleware } from "./Cors";
import { errorMiddleware } from "./Error";
import { pingRouter } from "./Routes/PingRouter";
import { getArticleJobRouter, jobShutdownHandler } from "./Routes/GetArticleJobRouter";
import { executeOnExit } from "./Cleanup";

const JOB_BASE_PATH = "/article";

const app = express();
expressWs(app);

app.use(morgan("dev"));
app.use(bodyParser.json());

app.use(corsMiddleware);
app.use(errorMiddleware);

app.use("/", pingRouter);
app.use(JOB_BASE_PATH, getArticleJobRouter());

executeOnExit(jobShutdownHandler)

const listenPort = config.getNumber(ConfigKey.ListenPort);
export const server = app.listen(listenPort);
