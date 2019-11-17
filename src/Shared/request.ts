export enum ResponseStatus {
  Success = "success",
  Failed = "failed",
}

export interface IResponseObject {
  status: ResponseStatus;
  message: string;
  data: object | null;
}

export function getResponseObject(): IResponseObject {
  return {
    status: ResponseStatus.Success,
    message: "",
    data: null,
  };
}
