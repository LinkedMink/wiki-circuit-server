import dotenv from "dotenv";
import fs from "fs";
import { configDefaultMap, ConfigKey } from "./ConfigKey";

enum Environment {
  Local = "local",
  UnitTest = "test",
  Development = "development",
  Production = "production",
}

export interface IPackageJson {
  name: string;
  version: string;
  description: string;
  license: string;
  repository: {
    type: string;
    url: string;
  };
  [property: string]: unknown;
}

export class EnvironmentalConfig {
  private readonly fileBuffers = new Map<ConfigKey, Buffer>();
  private readonly jsonData = new Map<ConfigKey, unknown>();
  private readonly packageJsonValue: IPackageJson;
  private readonly environment = process.env.NODE_ENV?.toLowerCase() ?? Environment.Local;

  constructor() {
    const dotEnvFile = `.env.${this.environment}`;
    if (fs.existsSync(dotEnvFile)) {
      dotenv.config({ path: dotEnvFile });
    }

    const filePath = "./package.json";
    const data = fs.readFileSync(filePath, "utf8");
    this.packageJsonValue = JSON.parse(data) as IPackageJson;
  }

  public get isEnvironmentLocal(): boolean {
    return this.environment === Environment.Local;
  }

  public get isEnvironmentUnitTest(): boolean {
    return this.environment === Environment.UnitTest;
  }

  public get isEnvironmentDev(): boolean {
    return this.environment === Environment.Development;
  }

  public get isEnvironmentProd(): boolean {
    return this.environment === Environment.Production;
  }

  public get isEnvironmentContainerized(): boolean {
    return process.env.IS_CONTAINER_ENV?.trim().toLowerCase() === "true";
  }

  public get packageJson(): IPackageJson {
    return this.packageJsonValue;
  }

  public getString = (key: ConfigKey): string => {
    return this.getConfigValue(key);
  };

  public getNumber = (key: ConfigKey): number => {
    const value = this.getConfigValue(key);
    return Number(value);
  };

  public getBool = (key: ConfigKey): boolean => {
    const value = this.getConfigValue(key);
    return value.trim().toLowerCase() === "true";
  };

  public getJsonOrString = <T>(key: ConfigKey): string | T => {
    const json = this.jsonData.get(key);
    if (json) {
      return json as string | T;
    }

    const value = this.getConfigValue(key).trim();
    if (value.length > 0 && (value.startsWith("{") || value.startsWith("["))) {
      return this.getJson(key);
    }

    return value;
  };

  public getJson = <T>(key: ConfigKey): T => {
    const json = this.jsonData.get(key);
    if (json) {
      return json as T;
    }

    const value = this.getConfigValue(key);
    const parsed = JSON.parse(value) as T;
    this.jsonData.set(key, parsed);
    return parsed;
  };

  public getFileBuffer = (key: ConfigKey): Buffer => {
    const buffer = this.fileBuffers.get(key);
    if (buffer) {
      return buffer;
    }

    if (process.env.NODE_ENV === Environment.UnitTest) {
      return Buffer.alloc(0);
    }

    const filePath = this.getConfigValue(key);
    const data = fs.readFileSync(filePath);
    this.fileBuffers.set(key, data);
    return data;
  };

  private getConfigValue = (key: ConfigKey): string => {
    let configValue = process.env[key];
    if (configValue) {
      return configValue;
    }

    configValue = configDefaultMap.get(key);
    if (configValue !== undefined) {
      return configValue;
    }

    throw new Error(`Environmental variable must be defined: ${key}`);
  };
}

export const config = new EnvironmentalConfig();
