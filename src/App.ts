import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';

import { config } from './Config';
import { getJobRouter } from './Routes/getJobRouter';
import { ArticleJobWork } from './Article/ArticleJobWork';
import { getMessageObject } from './Shared/Request';

const JOB_BASE_PATH = '/article'

const app = express();

app.use(bodyParser.json());

app.use(cors({
  origin: config.allowedOrigins,
  optionsSuccessStatus: 200
}));

app.use(morgan('dev'))

app.get('/', function(req, res) {
  res.send(getMessageObject());
});

app.use(JOB_BASE_PATH, getJobRouter(() => new ArticleJobWork()));

const server = app.listen(config.port, function() {});