import app from '@adonisjs/core/services/app';
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http';
import { DomainException, type ErrorDetail } from '#exceptions/domain_exception';
import type { IResponseError } from '#types/response';

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction;

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof DomainException) {
      return sendError(ctx, error.status, {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    if (isValidationError(error)) {
      return sendError(ctx, 422, {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: toErrorDetails(error.messages),
      });
    }

    const status = getClientErrorStatus(error);
    if (status) {
      return sendError(ctx, status, {
        code: getHttpErrorCode(status),
        message: getErrorMessage(error) ?? 'Request failed',
      });
    }

    return sendError(ctx, 500, {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx);
  }
}

function sendError(ctx: HttpContext, status: number, body: IResponseError) {
  return ctx.response.status(status).json(body);
}

function isValidationError(
  error: unknown
): error is { code: 'E_VALIDATION_ERROR'; messages: unknown[] } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'E_VALIDATION_ERROR' &&
    'messages' in error &&
    Array.isArray(error.messages)
  );
}

function toErrorDetails(messages: unknown[]): ErrorDetail[] {
  return messages.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null || !('message' in entry)) {
      return [];
    }
    const detail: ErrorDetail = {
      field: 'field' in entry && typeof entry.field === 'string' ? entry.field : '',
      message: typeof entry.message === 'string' ? entry.message : 'Invalid value',
    };
    if ('rule' in entry && typeof entry.rule === 'string') {
      detail.rule = entry.rule;
    }
    return [detail];
  });
}

function getClientErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return undefined;
  }

  if (typeof error.code !== 'string' || !error.code.startsWith('E_')) {
    return undefined;
  }

  if (error.code === 'E_INVALID_CREDENTIALS') {
    return 401;
  }

  const status =
    'status' in error && typeof error.status === 'number'
      ? error.status
      : 'statusCode' in error && typeof error.statusCode === 'number'
        ? error.statusCode
        : undefined;

  return status !== undefined && status >= 400 && status < 500 ? status : undefined;
}

function getHttpErrorCode(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    default:
      return 'HTTP_ERROR';
  }
}

function getErrorMessage(error: unknown): string | undefined {
  return typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
    ? error.message
    : undefined;
}
