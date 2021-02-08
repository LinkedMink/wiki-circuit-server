import { Router } from "express";
import { getRuntimeOpenApiDoc } from "../infastructure/OpenApi";

export const getOpenApiRouter = async (): Promise<Router> => {
  const swaggerUi = await import("swagger-ui-express");
  const openApiDoc = await getRuntimeOpenApiDoc();

  const getOpenApiRouter = Router();
  getOpenApiRouter.use("/", swaggerUi.serve);
  getOpenApiRouter.get(
    "/",
    swaggerUi.setup(openApiDoc, {
      isExplorer: true,
    })
  );

  return getOpenApiRouter;
};
