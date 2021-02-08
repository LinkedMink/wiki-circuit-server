#!/usr/bin/env node

import fs from "fs";

import { initializeLogger, Logger } from "../infastructure/Logger";
import { DEFAULT_OPENAPI_DOC_FILE, generateOpenApiDoc } from "../infastructure/OpenApi";

initializeLogger();
const logger = Logger.get();

const main = async () => {
  logger.info("Generate OpenAPI Doc - Start");

  const swaggerDoc = await generateOpenApiDoc();
  if (!swaggerDoc) {
    logger.info("Failed to generate OpenAPI Doc");
    process.exit(1);
  }

  const docData = JSON.stringify(swaggerDoc, undefined, 2);
  await fs.promises.writeFile(DEFAULT_OPENAPI_DOC_FILE, docData);

  logger.info(`Success! OpenAPI Doc Written: ${DEFAULT_OPENAPI_DOC_FILE}`);
};

void main()
  .then(() => process.exit(0))
  .catch(e => {
    logger.error({ message: e as Error });
    process.exit(1);
  });
