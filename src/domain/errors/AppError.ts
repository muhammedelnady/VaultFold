/**
 * AppError — VaultFold's layer-boundary error type.
 *
 * A discriminated union: every use case and repository returns `Result<T, AppError>`.
 * `DomainError` (./DomainError) provides base error classes; `toAppError` maps a
 * `DomainError` (or unknown throw) onto the union when crossing boundaries.
 */

export type AppError =
  | OfflineError
  | RateLimitedError
  | HttpError
  | ParseError
  | LockedError
  | NotFoundErrorVariant
  | ConflictErrorVariant
  | ValidationErrorVariant
  | UnknownError;

export interface OfflineError {
  readonly kind: "offline";
  readonly message: string;
  readonly cause?: unknown;
}

export interface RateLimitedError {
  readonly kind: "rate-limited";
  readonly retryAfterMs: number;
  readonly message: string;
  readonly cause?: unknown;
}

export interface HttpError {
  readonly kind: "http";
  readonly status: number;
  readonly message: string;
  readonly cause?: unknown;
}

export interface ParseError {
  readonly kind: "parse";
  readonly message: string;
  readonly cause?: unknown;
}

export interface LockedError {
  readonly kind: "locked";
  readonly message: string;
  readonly cause?: unknown;
}

export interface NotFoundErrorVariant {
  readonly kind: "not-found";
  readonly entity: string;
  readonly message: string;
  readonly cause?: unknown;
}

export interface ConflictErrorVariant {
  readonly kind: "conflict";
  readonly serverVersion?: number;
  readonly message: string;
  readonly cause?: unknown;
}

export interface ValidationErrorVariant {
  readonly kind: "validation";
  readonly field?: string;
  readonly message: string;
  readonly cause?: unknown;
}

export interface UnknownError {
  readonly kind: "unknown";
  readonly message: string;
  readonly cause?: unknown;
}

export const appErrorKind = [
  "offline",
  "rate-limited",
  "http",
  "parse",
  "locked",
  "not-found",
  "conflict",
  "validation",
  "unknown",
] as const;

export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    typeof (value as { kind: unknown }).kind === "string" &&
    (appErrorKind as readonly string[]).includes((value as { kind: string }).kind)
  );
}

export function describeAppError(error: AppError): string {
  switch (error.kind) {
    case "offline":
      return "offline";
    case "rate-limited":
      return `rate-limited (retry in ${Math.ceil(error.retryAfterMs / 1000)}s)`;
    case "http":
      return `http ${error.status}`;
    case "parse":
      return "parse error";
    case "locked":
      return "locked";
    case "not-found":
      return `${error.entity} not found`;
    case "conflict":
      return "conflict";
    case "validation":
      return "validation error";
    case "unknown":
      return "unknown error";
  }
}

export function toAppError(value: unknown, fallbackMessage = "Unexpected error"): AppError {
  if (isAppError(value)) {
    return value;
  }
  const err = value as {
    category?: string;
    retryAfterMs?: number;
    status?: number;
    message?: string;
  } | null;
  const message = err?.message ?? fallbackMessage;
  switch (err?.category) {
    case "NETWORK":
      return { kind: "offline", message, cause: value };
    case "TIMEOUT":
      return { kind: "http", status: 0, message, cause: value };
    case "SERVER":
      return { kind: "http", status: 500, message, cause: value };
    case "RATE_LIMIT":
      return { kind: "rate-limited", retryAfterMs: 60_000, message, cause: value };
    case "AUTH":
      return { kind: "locked", message, cause: value };
    case "NOT_FOUND":
      return { kind: "not-found", entity: "resource", message, cause: value };
    case "VALIDATION":
    case "SERIALIZATION":
      return { kind: "validation", message, cause: value };
    case "DATABASE":
    case "CACHE":
      return { kind: "unknown", message, cause: value };
    case "PERMISSION":
      return { kind: "locked", message, cause: value };
    default:
      return { kind: "unknown", message, cause: value };
  }
}
