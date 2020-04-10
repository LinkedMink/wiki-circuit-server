import { logger } from "../logger";
import { IProgress, JobStatus, JobWork, IJob } from "./jobInterfaces";

export class Job implements IJob {
  progress(value: IProgress) {
    this.progressState = value;
  }

  result(): object | null {
    return this.resultObject;
  }

  status() {
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
  private startTime = 0;
  private endTime = 0;
  private runTime = 0;
  private progressState: IProgress = {
    completed: 0,
    message: "",
    data: {},
  };
  private resultObject: object | null = null;
  
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
      logger.error(error);
    } else if (error instanceof Error) {
      this.progressState.message = error.message;
      logger.error(error.message);
      if (error.stack) {
        logger.error(error.stack);
      }
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
