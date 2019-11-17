import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import expressWs from "express-ws";
import morgan from "morgan";

import { ArticleJobWork } from "./Article/articleJobWork";
import { config } from "./config";
import { getJobRouter } from "./Routes/getJobRouter";
import { getResponseObject } from "./Shared/request";

const JOB_BASE_PATH = "/article";

const app = express();
expressWs(app);

app.use(bodyParser.json());

app.use(cors({
  origin: config.allowedOrigins,
  optionsSuccessStatus: 200,
}));

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send(getResponseObject());
});

app.use(JOB_BASE_PATH, getJobRouter(() => new ArticleJobWork()));

export const server = app.listen(config.port);
