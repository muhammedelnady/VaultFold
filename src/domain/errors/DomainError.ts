/**
 * DomainError — typed base error hierarchy for domain and infrastructure classes.
 *
 * Internal modules can construct and inspect `DomainError` subclasses, while the
 * layer-boundary contract uses the `AppError` discriminated union in./AppError.
 */

export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  AUTH = "AUTH",
  NETWORK = "NETWORK",
  SERVER = "SERVER",
  DATABASE = "DATABASE",
  CACHE = "CACHE",
  TIMEOUT = "TIMEOUT",
  SERIALIZATION = "SERIALIZATION",
  PERMISSION = "PERMISSION",
  RATE_LIMIT = "RATE_LIMIT",
  UNKNOWN = "UNKNOWN",
}

export abstract class DomainError extends Error {
  public abstract readonly category: ErrorCategory;

  public constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  public readonly category = ErrorCategory.VALIDATION;

  public constructor(
    message = "Validation failed",
    code = "VALIDATION_ERROR",
    details?: Record<string, unknown>,
  ) {
    super(message, code, details);
  }
}

export class NotFoundError extends DomainError {
  public readonly category = ErrorCategory.NOT_FOUND;

  public constructor(
    message = "Not found",
    code = "NOT_FOUND_ERROR",
    details?: Record<string, unknown>,
  ) {
    super(message, code, details);
  }
}
