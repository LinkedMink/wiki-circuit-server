import fs from 'fs';

function loadConfig(configFileName: string) {
  const data = fs.readFileSync(configFileName, "utf8");
  const json = JSON.parse(data);
  return json;
}
  
export const config = loadConfig("config.json");