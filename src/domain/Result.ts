/**
 * Result<T, E> — functional error handling monad.
 *
 * Every use case and repository in VaultFold returns `Result<T, AppError>`.
 * Discriminant is `kind: "ok" | "err"` (not `ok: boolean`); do not change this.
 */

import type { DomainError } from "./errors";

export interface Ok<T> {
  readonly kind: "ok";
  readonly value: T;
}

export interface Err<E> {
  readonly kind: "err";
  readonly error: E;
}

export type Result<T, E = DomainError> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { kind: "ok", value };
}

export function err<E = DomainError>(error: E): Err<E> {
  return { kind: "err", error };
}

export function isOk<T, E>(result: Result<T, E> | undefined | null): result is Ok<T> {
  return result?.kind === "ok";
}

export function isErr<T, E>(result: Result<T, E> | undefined | null): result is Err<E> {
  return result?.kind === "err";
}

export function unwrap<T, E>(result: Result<T, E> | undefined | null): T {
  if (!result) {
    throw new Error("Cannot unwrap undefined or null Result");
  }
  if (isErr(result)) {
    throw new Error(`Cannot unwrap error Result: ${String(result.error)}`);
  }
  return result.value;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
}

export function match<T, E, U>(
  result: Result<T, E> | undefined | null,
  handlers: {
    ok: (value: T) => U;
    err: (error: E | undefined) => U;
  },
): U {
  if (result && isOk(result)) {
    return handlers.ok(result.value);
  }
  return handlers.err(result?.error);
}

export function tap<T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> {
  if (isOk(result)) fn(result.value);
  return result;
}
