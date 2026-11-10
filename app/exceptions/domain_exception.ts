export type ErrorDetail = {
  field: string;
  message: string;
  rule?: string;
};

export abstract class DomainException extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: ErrorDetail[]
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundException extends DomainException {
  constructor(message: string, details?: ErrorDetail[]) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

export class ConflictException extends DomainException {
  constructor(message: string, details?: ErrorDetail[]) {
    super(message, 'CONFLICT', 409, details);
  }
}

export class TooManyRequestsException extends DomainException {
  constructor(message = 'Too many requests') {
    super(message, 'TOO_MANY_REQUESTS', 429);
  }
}

export class InsufficientStockError extends DomainException {
  constructor(message: string) {
    super(message, 'INSUFFICIENT_STOCK', 409);
  }
}

export class ForbiddenException extends DomainException {
  constructor(message: string, details?: ErrorDetail[]) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message: string, details?: ErrorDetail[]) {
    super(message, 'UNAUTHORIZED', 401, details);
  }
}

export class PreconditionRequiredException extends DomainException {
  constructor(message: string) {
    super(message, 'PRECONDITION_REQUIRED', 428);
  }
}

export class DomainRuleException extends DomainException {
  constructor(message: string, details?: ErrorDetail[]) {
    super(message, 'DOMAIN_RULE_VIOLATION', 422, details);
  }
}

export class InternalServerException extends DomainException {
  constructor(message: string, details?: ErrorDetail[]) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, details);
  }
}
