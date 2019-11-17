import fs from "fs";

const CONFIG_FILE = "config.json";

const environmentVariableOverrides: { [key: string]: string; } = {
  SERVER_PORT: "port",
  ALLOWED_ORIGINS: "allowedOrigins",
};

function loadConfig(configFileName: string) {
  const data = fs.readFileSync(configFileName, "utf8");
  const properties = JSON.parse(data);

  Object.keys(environmentVariableOverrides).forEach((variable) => {
    if (process.env[variable]) {
      properties[environmentVariableOverrides[variable]] = process.env[variable];
    }
  });

  return properties;
}

export const config = loadConfig(CONFIG_FILE);
