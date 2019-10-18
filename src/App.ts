import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';

import { config } from './Config';
import addJobRoutes from './Routes/addJobRoutes';
import { ArticleJobWork } from './Article/ArticleJobWork';
import { getMessageObject } from './Shared/Request';

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: config.allowedOrigins,
  optionsSuccessStatus: 200
}));
app.use(morgan('combined'))

app.get('/', function(req, res) {
  res.send(getMessageObject());
});

addJobRoutes(app, '/article', () => new ArticleJobWork());

const server = app.listen(config.port, function() {});