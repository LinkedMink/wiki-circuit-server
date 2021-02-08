import { OpenAPIV3 } from "openapi-types";
import { IPermissionClaimModel } from "./IPermissionClaimModel";
import { IUserEntityModel } from "./IUserEntityModel";

export interface ITaskTypeModel extends IUserEntityModel {
  name: string;
  description?: string;
  permissions?: IPermissionClaimModel;
  isProgressReported: boolean;
  isSuspendable: boolean;
  isCancelable: boolean;
  keepInactiveForMinutes: number;
  parameterSchema?: OpenAPIV3.SchemaObject;
  resultSchema?: OpenAPIV3.SchemaObject;
}
