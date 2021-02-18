import EventEmitter from "events";
import { IProgressModel } from "../models/api/IProgressModel";

export enum RunnableTaskEvent {
  Complete = "complete",
  Update = "update",
  Fault = "fault",
}

export interface IRunnableTask<
  TParams = unknown,
  TResult = unknown,
  TProgress = undefined,
  TState = undefined
> extends EventEmitter {
  start(params: TParams): Promise<boolean> | boolean;
  suspend(): Promise<TState> | TState;
  cancel(): Promise<boolean> | boolean;
  registerOnComplete(handler: (result: TResult) => void): void;
  registerOnUpdate(handler: (update: IProgressModel<TProgress>) => void): void;
  registerOnFault(handler: (reason?: unknown) => void): void;
}
