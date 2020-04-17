export enum ResponseStatus {
  Success = 0,
  Failed = 1,
  RequestValidation = 10,
  DataValidation = 11,
}

/**
 * @swagger
 * definitions:
 *   ErrorResponse:
 *     type: object
 *     properties:
 *       status:
 *         type: integer
 *       data:
 *         type: string
 */
export interface IResponseData {
  status: ResponseStatus;
  data: object[] | object | string | null;
}

export const getResponseObject = (
  status: ResponseStatus = ResponseStatus.Success,
  data: object[] | object | string | null = null): IResponseData => {
  return { status, data };
};

export const getResponseSuccess = (
  data: object[] | object | string | null = null): IResponseData => {
  return { status: ResponseStatus.Success, data };
};

export const getResponseFailed = (
  data: object[] | object | string | null = null): IResponseData => {
  return { status: ResponseStatus.Failed, data };
};
