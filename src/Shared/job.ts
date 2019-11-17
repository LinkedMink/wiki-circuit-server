import { logger } from "../logger";
import { IProgress, JobStatus, JobWork } from "./jobInterfaces";

export class Job {
  set progress(value: IProgress) {
    this.progressState = value;
  }

  get result(): object | undefined {
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
      result: this.resultObject ? this.resultObject : null,
    };
  }

  private jobStatus: JobStatus = JobStatus.Ready;
  private startTime: number = 0;
  private endTime: number = 0;
  private runTime: number = 0;
  private progressState: IProgress = {
    completed: 0,
    message: "",
    data: {},
  };
  private resultObject?: object;
  constructor(
    private id: string,
    private work: JobWork) {}

  public start = (params: any) => {
    this.jobStatus = JobStatus.Running;
    this.startTime = Date.now();

    this.work.doWork(this, params);

    logger.info(`Started: ${this.id} @ ${this.startTime}`);
  }

  public complete = (result: object) => {
    this.resultObject = result;

    this.jobStatus = JobStatus.Complete;
    this.setCompletedIn();
  }

  public fault = (error?: Error | string) => {
    if (typeof error === "string") {
      this.progressState.message = error;
    } else if (error instanceof Error) {
      this.progressState.message = error.message;
    }

    this.jobStatus = JobStatus.Faulted;
    this.setCompletedIn();
  }

  private setCompletedIn = () => {
    this.endTime = Date.now();
    this.runTime = this.endTime - this.startTime;

    logger.info(`Finished: ${this.id} @ ${this.endTime} ran for ${this.runTime}`);
  }
}
