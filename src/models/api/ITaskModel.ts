import { IBaseTaskModel } from "./IBaseTaskModel";
import { IProgressModel } from "./IProgressModel";

export enum TaskStatus {
  Ready = "ready",
  Running = "running",
  Suspended = "suspended",
  Faulted = "faulted",
  Complete = "complete",
  Canceled = "canceled",
}

export interface ITaskModel<
  TResult = unknown,
  TParams = unknown,
  TState = unknown,
  TResultSample = unknown
> extends IBaseTaskModel<TResult, TParams> {
  status: TaskStatus;
  progress?: IProgressModel<TResultSample>;
  state?: TState;
}
