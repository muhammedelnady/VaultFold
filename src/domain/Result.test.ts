/**
 * Unit tests for Result type functional combinators and unwrapping.
 */

import { describe, expect, it } from "@jest/globals";

import { DomainError, ErrorCategory, ValidationError } from "./errors";
import { err, flatMap, isErr, isOk, map, match, ok, Result, tap, unwrap, unwrapOr } from "./Result";

describe("Result", () => {
  it("ok/err constructors set the kind discriminant", () => {
    expect(ok(1)).toMatchObject({ kind: "ok", value: 1 });
    expect(err("boom")).toMatchObject({ kind: "err", error: "boom" });
  });

  it("isOk/isErr narrow undefined and null safely", () => {
    expect(isOk(ok(1))).toBe(true);
    expect(isErr(err(1))).toBe(true);
    expect(isOk(undefined)).toBe(false);
    expect(isErr(null)).toBe(false);
  });

  it("unwrap throws on error and null, returns value on ok", () => {
    expect(unwrap(ok(7))).toBe(7);
    expect(() => unwrap(err("x"))).toThrow("Cannot unwrap error Result: x");
    expect(() => unwrap(null)).toThrow("Cannot unwrap undefined or null Result");
  });

  it("unwrapOr falls back on error", () => {
    expect(unwrapOr(ok(2), -1)).toBe(2);
    expect(unwrapOr(err("e"), -1)).toBe(-1);
  });

  it("map/flatMap transform only the ok path", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual({ kind: "ok", value: 4 });
    expect(map<number, number, string>(err("no"), (n) => n * 2)).toEqual({
      kind: "err",
      error: "no",
    });
    expect(flatMap(ok(2), (n) => ok(n * 3))).toEqual({ kind: "ok", value: 6 });
    expect(flatMap<number, number, string>(err("no"), (n) => ok(n))).toEqual({
      kind: "err",
      error: "no",
    });
  });

  it("match handles both branches including undefined input", () => {
    expect(match(ok(1), { ok: (v) => v + 1, err: () => -1 })).toBe(2);
    expect(
      match<number, string, number>(err("x"), { ok: (v) => v, err: (e) => (e === "x" ? 0 : 1) }),
    ).toBe(0);
    expect(match<number, string, number>(undefined, { ok: () => 1, err: () => -1 })).toBe(-1);
  });

  it("tap observes without changing the result", () => {
    let seen: number | null = null;
    const result: Result<number, string> = tap(ok(5), (v) => (seen = v));
    expect(seen).toBe(5);
    expect(result).toEqual({ kind: "ok", value: 5 });

    let errSeen = false;
    tap(err("e"), () => (errSeen = true));
    expect(errSeen).toBe(false);
  });

  it("DomainError subclasses carry category/code", () => {
    const e = new ValidationError("bad qty");
    expect(e.category).toBe(ErrorCategory.VALIDATION);
    expect(e.code).toBe("VALIDATION_ERROR");
    expect(e).toBeInstanceOf(DomainError);
  });
});
