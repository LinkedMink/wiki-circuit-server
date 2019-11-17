import { Job } from "./job";

export enum JobStatus {
  Ready = "ready",
  Running = "running",
  Faulted = "faulted",
  Complete = "complete",
}

export interface IProgress {
  completed: number;
  message: string;
  data: object;
}

export abstract class JobWork {
  public abstract doWork(job: Job, params: any): void;
}
