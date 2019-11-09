export enum ResponseStatus {
  Success = 'success',
  Failed = 'failed'
}

export interface ResponseObject {
  status: ResponseStatus,
  message: string,
  data: Object | null
}

export function getResponseObject(): ResponseObject {
  return {
    status: ResponseStatus.Success,
    message: '',
    data: null
  };
}