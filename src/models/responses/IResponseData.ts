export enum ResponseStatus {
  Success = 0,
  Failed = 1,
  RequestValidation = 10,
  DataValidation = 11,
}

export interface IResponseData<T = null> {
  status: ResponseStatus;
  data: T;
}

export const response = {
  get: <T>(
    status: ResponseStatus = ResponseStatus.Success,
    data: T | null = null
  ): IResponseData<T> => ({ status, data } as IResponseData<T>),
  success: <T>(data: T | null = null): IResponseData<T> =>
    ({ status: ResponseStatus.Success, data } as IResponseData<T>),
  failed: <T>(data: T | null = null): IResponseData<T> =>
    ({ status: ResponseStatus.Failed, data } as IResponseData<T>),
};
