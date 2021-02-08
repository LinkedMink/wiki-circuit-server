import { OpenApiDocument } from "express-openapi-validate";
import fs from "fs";
import { basename } from "path";

import { config } from "./Config";
import { Logger } from "./Logger";

let runtimeDoc: OpenApiDocument;

export const DEFAULT_OPENAPI_DOC_FILE = "docs/OpenApi.json";

export const generateOpenApiDoc = async (): Promise<OpenApiDocument> => {
  const swaggerJsDoc = await import("swagger-jsdoc");
  Logger.get(basename(__filename)).info("Generating OpenAPI document from source");

  return swaggerJsDoc.default({
    definition: {
      openapi: "3.0.3",
      info: {
        title: config.packageJson.name,
        description: config.packageJson.description,
        license: config.packageJson.license
          ? {
              name: config.packageJson.license,
              url: config.packageJson.repository.url
                ? `${config.packageJson.repository.url}/blob/master/LICENSE`
                : undefined,
            }
          : undefined,
        version: config.packageJson.version,
      },
    },
    apis: [
      "./docs/*.{yml,yaml}",
      "./src/models/{requests,responses}/*.{yml,yaml,ts}",
      "./src/routes/*.{yml,yaml,ts}",
    ],
  }) as OpenApiDocument;
};

export const loadOpenApiDocFile = async (
  filename = DEFAULT_OPENAPI_DOC_FILE
): Promise<OpenApiDocument> => {
  Logger.get(basename(__filename)).info(`Loading OpenAPI document: ${filename}`);
  const data = await fs.promises.readFile(filename, "utf8");
  const swaggerSpec = JSON.parse(data) as OpenApiDocument;
  return swaggerSpec;
};

export const getRuntimeOpenApiDoc = async (): Promise<OpenApiDocument> => {
  if (runtimeDoc) {
    return runtimeDoc;
  }

  runtimeDoc = await (config.isEnvironmentLocal ? generateOpenApiDoc() : loadOpenApiDocFile());

  return runtimeDoc;
};
