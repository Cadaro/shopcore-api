import type { ErrorDetail } from '#exceptions/domain_exception';

export interface IResponseError {
  code: string;
  message: string;
  details?: ErrorDetail[];
}
