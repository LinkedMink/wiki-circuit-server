import bodyParser from "body-parser";
import express from "express";
import expressWs from "express-ws";
import morgan from "morgan";

import { ArticleJobWork } from "./Article/articleJobWork";
import { config, ConfigKey } from "./config";
import { corsMiddleware } from "./cors";
import { errorMiddleware } from "./error";
import { getJobRouter } from "./Routes/getJobRouter";
import { getResponseObject } from "./Shared/response";

const JOB_BASE_PATH = "/article";

const app = express();
expressWs(app);

app.use(morgan("dev"));
app.use(bodyParser.json());

app.use(corsMiddleware);
app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.send(getResponseObject());
});

app.use(JOB_BASE_PATH, getJobRouter(() => new ArticleJobWork()));

export const server = app.listen(config.getString(ConfigKey.ListenPort));
