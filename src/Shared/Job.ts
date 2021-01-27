import { Logger } from "../Logger";
import {
  IProgress,
  JobStatus,
  IJobWork,
  IJob,
  ProgressHandler,
  IJobStatus,
} from "./JobInterfaces";
import { config, ConfigKey } from "../Config";

const progressReportThreshold = config.getNumber(
  ConfigKey.JobProgressReportThreshold
);

export class Job implements IJob {
  private readonly logger = Logger.get(Job.name);
  private lastProgressReport = 0;

  progress(value: IProgress): void {
    this.progressState = value;
    if (this.lastProgressReport + progressReportThreshold > value.completed) {
      this.reportProgress();
    }
  }

  result(): unknown | null {
    return this.resultObject;
  }

  status(): IJobStatus {
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
  private resultObject: unknown | null = null;

  constructor(
    private readonly id: string,
    private readonly work: IJobWork,
    private readonly progressListener?: ProgressHandler
  ) {}

  public start = (params: unknown): void => {
    this.jobStatus = JobStatus.Running;
    this.startTime = Date.now();

    this.work.doWork(this, params);

    this.logger.info(`Started: ${this.id} @ ${this.startTime}`);
  };

  public stop = (): Promise<void> => {
    return this.work.stop();
  };

  public complete = (result: unknown): void => {
    this.resultObject = result;

    this.jobStatus = JobStatus.Complete;
    this.setCompletedIn();
  };

  public fault = (error?: Error | string): void => {
    if (typeof error === "string") {
      this.progressState.message = error;
      this.logger.error(error);
    } else if (error instanceof Error) {
      this.progressState.message = error.message;
      this.logger.error(error.message);
      if (error.stack) {
        this.logger.error(error.stack);
      }
    }

    this.jobStatus = JobStatus.Faulted;
    this.setCompletedIn();
  };

  private setCompletedIn = (): void => {
    this.endTime = Date.now();
    this.runTime = this.endTime - this.startTime;

    this.logger.info(
      `Finished: ${this.id} @ ${this.endTime} ran for ${this.runTime}`
    );
    this.reportProgress();
  };

  private reportProgress = (): void => {
    if (this.progressListener !== undefined) {
      this.progressListener(this);
      this.lastProgressReport = this.progressState.completed;
    }
  };
}
