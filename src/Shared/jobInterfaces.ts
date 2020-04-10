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
  complete(result: object): void;
  fault(error?: Error | string): void;
}

export class JobData implements IJob {
  constructor(private statusData: IJobStatus) {}

  progress(value: IProgress): void {
    throw new Error("Method not implemented.");
  }

  result(): object | null {
    return this.statusData.result;
  }

  status(): IJobStatus {
    return this.statusData;
  }

  start(params: any): void {
    throw new Error("Method not implemented.");
  }

  complete(result: object): void {
    throw new Error("Method not implemented.");
  }

  fault(error?: string | Error | undefined): void {
    throw new Error("Method not implemented.");
  }
}

export abstract class JobWork {
  public abstract doWork(job: IJob, params: any): void;
}
