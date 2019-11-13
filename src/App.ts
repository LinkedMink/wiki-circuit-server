import express from 'express';
import expressWs from 'express-ws'
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';

import { config } from './config';
import { getJobRouter } from './Routes/getJobRouter';
import { ArticleJobWork } from './Article/ArticleJobWork';
import { getResponseObject } from './Shared/Request';

const JOB_BASE_PATH = '/article'

const app = express();
expressWs(app);

app.use(bodyParser.json());

app.use(cors({
  origin: config.allowedOrigins,
  optionsSuccessStatus: 200
}));

app.use(morgan('dev'))

app.get('/', function(req, res) {
  res.send(getResponseObject());
});

app.use(JOB_BASE_PATH, getJobRouter(() => new ArticleJobWork()));

export const server = app.listen(config.port, function() {});