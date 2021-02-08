import { ITrackedEntityModel } from "./ITrackedEntityModel";

export interface IUserEntityModel extends ITrackedEntityModel {
  userId?: string;
}
