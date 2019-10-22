export enum JobStatus {
  Ready = 'ready',
  Running = 'running',
  Faulted = 'faulted',
  Complete = 'complete'
}

export interface Progress {
  completed: number;
  message: string;
  data: Object;
}

export abstract class JobWork {
  abstract doWork(job: Job, params: any): void;
}

export class Job {
  constructor(
    private id: string, 
    private work: JobWork) {}

  start = (params: any) => {
    this.jobStatus = JobStatus.Running;
    this.startTime = Date.now();

    this.work.doWork(this, params);

    console.log(`Started: ${this.id} @ ${this.startTime}`);
  }

  complete = (result: Object) => {
    this.resultObject = result;

    this.jobStatus = JobStatus.Complete;
    this.setCompletedIn();
  }

  fault = (error?: Error | string) => {
    if (typeof error === 'string') {
      this.progressState.message = error;
    } else if (error instanceof Error) {
      this.progressState.message = error.message
    }

    this.jobStatus = JobStatus.Faulted;
    this.setCompletedIn();
  }

  set progress(value: Progress) {
    this.progressState = value;
  }

  get result(): Object | undefined {
    return this.resultObject;
  }

  get status() {
    return {
      status: this.jobStatus,
      id: this.id,
      progress: this.progressState,
      startTime: this.startTime,
      endTime: this.endTime,
      runTime: this.runTime,
      result: this.resultObject ? this.resultObject : null
    }
  }

  private setCompletedIn = () => {
    this.endTime = Date.now();
    this.runTime = this.endTime - this.startTime;

    console.log(`Finished: ${this.id} @ ${this.endTime} ran for ${this.runTime}`);
  }

  private jobStatus: JobStatus = JobStatus.Ready;
  private startTime: number = 0;
  private endTime: number = 0;
  private runTime: number = 0;
  private progressState: Progress = { 
    completed: 0, 
    message: '', 
    data: {} 
  };
  private resultObject?: Object;
}