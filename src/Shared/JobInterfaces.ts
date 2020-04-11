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

export type ProgressHandler = (job: IJob) => void

export interface IJobStatus {
  status: JobStatus;
  id: string;
  progress: IProgress;
  startTime: number;
  endTime: number;
  runTime: number;
  result: object | null;
}

export interface IJob {
  progress(value: IProgress): void;
  result(): object | null ;
  status(): IJobStatus;

  start(params: any): void;
  stop(): Promise<void>;
  complete(result: object): void;
  fault(error?: Error | string): void;
}

export class JobData implements IJob {
  constructor(private statusData: IJobStatus) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  progress(value: IProgress): void {
    throw new Error("Method not implemented.");
  }

  result(): object | null {
    return this.statusData.result;
  }

  status(): IJobStatus {
    return this.statusData;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  start(params: any): void {
    throw new Error("Method not implemented.");
  }

  stop(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  complete(result: object): void {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  fault(error?: string | Error | undefined): void {
    throw new Error("Method not implemented.");
  }
}

export interface IJobWork {
  doWork(job: IJob, params: any): void;
  stop(): Promise<void>;
}
