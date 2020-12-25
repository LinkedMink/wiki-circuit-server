export enum JobStatus {
  Ready = "ready",
  Running = "running",
  Faulted = "faulted",
  Complete = "complete",
}

export interface IProgress {
  completed: number;
  message: string;
  data: Record<string, unknown>;
}

export type ProgressHandler = (job: IJob) => void;

export interface IJobStatus {
  status: JobStatus;
  id: string;
  progress: IProgress;
  startTime: number;
  endTime: number;
  runTime: number;
  result: unknown | null;
}

export interface IJob {
  progress(value: IProgress): void;
  result(): unknown | null;
  status(): IJobStatus;

  start(params: unknown): void;
  stop(): Promise<void>;
  complete(result: unknown): void;
  fault(error?: Error | string): void;
}

export class JobData implements IJob {
  constructor(private statusData: IJobStatus) {}

  progress(value: IProgress): void {
    throw new Error("Method not implemented.");
  }

  result(): unknown | null {
    return this.statusData.result;
  }

  status(): IJobStatus {
    return this.statusData;
  }

  start(params: unknown): void {
    throw new Error("Method not implemented.");
  }

  stop(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  complete(result: Record<string, unknown>): void {
    throw new Error("Method not implemented.");
  }

  fault(error?: string | Error | undefined): void {
    throw new Error("Method not implemented.");
  }
}

export interface IJobWork {
  doWork(job: IJob, params: unknown): void;
  stop(): Promise<void>;
}
