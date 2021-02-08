import { OpenApiValidator } from "express-openapi-validate";
import { getRuntimeOpenApiDoc } from "../infastructure/OpenApi";

let validatorHandler: OpenApiValidator;
export const getValidator = async (): Promise<OpenApiValidator> => {
  if (validatorHandler) {
    return validatorHandler;
  }

  const openApiDocument = await getRuntimeOpenApiDoc();
  validatorHandler = new OpenApiValidator(openApiDocument);
  return validatorHandler;
};
