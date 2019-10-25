import fs from 'fs';

const CONFIG_FILE = "config.json";

function loadConfig(configFileName: string) {
  const data = fs.readFileSync(configFileName, "utf8");
  const json = JSON.parse(data);
  return json;
}
  
export const config = loadConfig(CONFIG_FILE);