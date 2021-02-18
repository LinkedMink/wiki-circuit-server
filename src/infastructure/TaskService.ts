import { Logger } from "@linkedmink/multilevel-aging-cache";
import { AxiosInstance } from "axios";
import { timeStamp } from "console";
import { emit } from "process";
import { Socket } from "socket.io-client";
import { ArticleLinkScanTask } from "../data/ArticleLinkScanTask";
import {
  IArticleLinkScanParams,
  IArticleLinkScanResult,
  IArticleLinkScanProgress,
  IArticleLinkScanState,
  IArticleResult,
} from "../data/IArticleLinkScan";
import { IRunnableTask } from "../data/IRunnableTask";
import { IProgressModel } from "../models/api/IProgressModel";
import { ITaskModel } from "../models/api/ITaskModel";
import { SocketFactory } from "./Socket";

const RUN_NAMESPACE = "/task/run/ArticleLinkScan";
const BASE_PATH = "/task/queue/ArticleLinkScan/"

type ArticleTaskModel = ITaskModel<
  IArticleLinkScanResult,
  IArticleLinkScanParams,
  IArticleLinkScanState,
  IArticleLinkScanProgress
>;

export enum TaskRunEvent {
  Initiate = "initiate",
  ReportProgress = "reportProgress",
}

export enum TaskRunOutboundEvent {
  Canceled = "canceled",
  TaskPeeked = "taskPeeked",
}

export class TaskService {
  private readonly logger = Logger.get(TaskService.name)
  private socket?: Socket;
  private activeTask?: ArticleTaskModel;
  private runningTask?: ArticleLinkScanTask

  constructor(
    private readonly axios: AxiosInstance,
    private readonly socketFactory: SocketFactory
  ) {}

  start(): void {
    this.socket = this.socketFactory.get(RUN_NAMESPACE);

    this.socket.on(TaskRunOutboundEvent.TaskPeeked, this.nextTaskHandler);
  }

  private nextTaskHandler = (task: ArticleTaskModel) => {
    if(!this.socket) {
      return;
    }

    this.socket.off(TaskRunOutboundEvent.TaskPeeked);

    this.activeTask = task;
    this.runningTask = new ArticleLinkScanTask();
    this.runningTask.registerOnComplete(this.completeTaskHandler);
    this.runningTask.registerOnFault(this.faultTaskHandler);
    this.runningTask.registerOnUpdate(this.updateTaskHandler);
    this.runningTask.start(task.parameters as IArticleLinkScanParams);

    this.socket.on(TaskRunOutboundEvent.Canceled, this.cancelTaskHandler);
    this.socket.emit(TaskRunEvent.Initiate, task.id);
  };

  private cancelTaskHandler = (update: IProgressModel<IArticleLinkScanProgress>) => {
    if(!this.runningTask) {
      return;
    }

  };

  private completeTaskHandler = (result: IArticleLinkScanResult) => {
    if(!this.activeTask) {
      return;
    }

    const data = this.activeTask.result = result;
    void this.axios.post(`${BASE_PATH}${this.activeTask.id}`, data)
      .then(r => {
        this.socket?.on(TaskRunOutboundEvent.TaskPeeked, this.nextTaskHandler);
      })
      .catch((e: unknown) => this.logger.error({ message: e }))
  };

  private faultTaskHandler = (reason: unknown) => {
    if(!this.activeTask) {
      return;
    }

    void this.axios.delete(`${BASE_PATH}${this.activeTask.id}`, { data: reason })
      .then(r => {
        this.socket?.on(TaskRunOutboundEvent.TaskPeeked, this.nextTaskHandler);
      })
      .catch((e: unknown) => this.logger.error({ message: e }))
  };

  private updateTaskHandler = (update: IProgressModel<IArticleLinkScanProgress>) => {
    if(!this.socket) {
      return;
    }

    this.socket.emit(TaskRunEvent.ReportProgress, this.updateTaskHandler);
  };
}
