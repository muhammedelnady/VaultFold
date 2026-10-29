/** AppError tests. */
import { describe, it, expect } from "@jest/globals";

import { isAppError, describeAppError, toAppError, AppError, appErrorKind } from "./AppError";

describe("AppError", () => {
  describe("isAppError", () => {
    it("recognizes valid AppError objects", () => {
      expect(isAppError({ kind: "offline", message: "test" })).toBe(true);
    });

    it("rejects objects without kind", () => {
      expect(isAppError({ msg: "no kind" })).toBe(false);
    });

    it("rejects null", () => {
      expect(isAppError(null)).toBe(false);
    });
  });

  describe("describeAppError", () => {
    it("formats all 9 kinds", () => {
      expect(describeAppError({ kind: "offline", message: "x" })).toBe("offline");
      expect(describeAppError({ kind: "rate-limited", message: "x", retryAfterMs: 60000 })).toBe(
        "rate-limited (retry in 60s)",
      );
      expect(describeAppError({ kind: "http", message: "x", status: 400 })).toBe("http 400");
      expect(describeAppError({ kind: "parse", message: "x" })).toBe("parse error");
      expect(describeAppError({ kind: "locked", message: "x" })).toBe("locked");
      expect(describeAppError({ kind: "not-found", message: "x", entity: "coin" })).toBe(
        "coin not found",
      );
      expect(describeAppError({ kind: "conflict", message: "x" })).toBe("conflict");
      expect(describeAppError({ kind: "validation", message: "x" })).toBe("validation error");
      expect(describeAppError({ kind: "unknown", message: "x" })).toBe("unknown error");
    });
  });

  describe("toAppError", () => {
    it("passes through existing AppError", () => {
      const err: AppError = { kind: "offline", message: "test", cause: new Error() };
      expect(toAppError(err)).toEqual(err);
    });

    it("maps categories to AppError kinds", () => {
      expect(toAppError({ category: "NETWORK", message: "offline" }).kind).toBe("offline");
      expect(toAppError({ category: "TIMEOUT", message: "timed out" })).toMatchObject({
        kind: "http",
        status: 0,
      });
      expect(toAppError({ category: "SERVER", message: "internal error" })).toMatchObject({
        kind: "http",
        status: 500,
      });
      expect(toAppError({ category: "RATE_LIMIT", message: "rate limited" }).kind).toBe(
        "rate-limited",
      );
      expect(toAppError({ category: "AUTH", message: "locked" }).kind).toBe("locked");
      expect(toAppError({ category: "PERMISSION", message: "forbidden" }).kind).toBe("locked");
      expect(toAppError({ category: "NOT_FOUND", message: "not found" }).kind).toBe("not-found");
      expect(toAppError({ category: "VALIDATION", message: "bad input" }).kind).toBe("validation");
      expect(toAppError({ category: "SERIALIZATION", message: "bad serialize" }).kind).toBe(
        "validation",
      );
      expect(toAppError({ category: "DATABASE", message: "db error" }).kind).toBe("unknown");
      expect(toAppError({ category: "CACHE", message: "cache error" }).kind).toBe("unknown");
      expect(toAppError({ category: "SOMETHING_ELSE" }).kind).toBe("unknown");
      expect(toAppError(undefined).message).toBe("Unexpected error");
    });
  });

  describe("appErrorKind", () => {
    it("includes all 9 error kinds", () => {
      expect(appErrorKind.length).toBe(9);
    });
  });
});
