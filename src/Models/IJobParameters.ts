export interface IJobIdParams {
  id: string;
}

export interface IJobStartParams {
  id: string;
  refresh?: boolean;
}

export const isIJobIdParams = (value: unknown): value is IJobIdParams => {
  return (value as IJobIdParams).id !== undefined;
};

export const isIJobStartParams = (value: unknown): value is IJobStartParams => {
  return (value as IJobStartParams).id !== undefined;
};
