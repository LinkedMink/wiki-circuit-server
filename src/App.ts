import fs from 'fs';
import express from 'express';
import morgan from 'morgan';

import addJobRoutes from './Routes/Job';
import { getMessageObject } from './Types/Request';

function loadConfig(configFileName: string) {
  const data = fs.readFileSync(configFileName, "utf8");
  const json = JSON.parse(data);
  return json;
}

const config = loadConfig("config.json");

const app = express();
app.use(morgan('combined'))

app.get('/', function(req, res) {
  res.send(getMessageObject());
});

addJobRoutes(app);

const server = app.listen(config.port, function() {});