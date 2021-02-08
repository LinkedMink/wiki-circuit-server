export interface IProgressModel<T> {
  completedRatio: number;
  estimatedCompletedBy?: Date;
  resultSample?: T;
}
