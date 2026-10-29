/** DomainError tests. */
import { describe, it, expect } from "@jest/globals";

import { ErrorCategory, DomainError, ValidationError, NotFoundError } from "./DomainError";

describe("DomainError", () => {
  describe("ErrorCategory enum", () => {
    it("ErrorCategory has expected values", () => {
      expect(ErrorCategory.VALIDATION).toBe("VALIDATION");
      expect(ErrorCategory.NOT_FOUND).toBe("NOT_FOUND");
      expect(ErrorCategory.AUTH).toBe("AUTH");
      expect(ErrorCategory.NETWORK).toBe("NETWORK");
      expect(ErrorCategory.SERVER).toBe("SERVER");
      expect(ErrorCategory.UNKNOWN).toBe("UNKNOWN");
    });
  });

  describe("ValidationError", () => {
    it("has correct category", () => {
      const err = new ValidationError();
      expect(err.category).toBe(ErrorCategory.VALIDATION);
    });

    it("has default code and message", () => {
      const err = new ValidationError();
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.message).toBe("Validation failed");
    });

    it("accepts custom params", () => {
      const err = new ValidationError("Custom", "CUSTOM", { field: "x" });
      expect(err.category).toBe(ErrorCategory.VALIDATION);
      expect(err.code).toBe("CUSTOM");
      expect(err.message).toBe("Custom");
      expect(err.details).toEqual({ field: "x" });
    });
  });

  describe("NotFoundError", () => {
    it("has correct category", () => {
      const err = new NotFoundError();
      expect(err.category).toBe(ErrorCategory.NOT_FOUND);
    });

    it("has default code and message", () => {
      const err = new NotFoundError();
      expect(err.code).toBe("NOT_FOUND_ERROR");
      expect(err.message).toBe("Not found");
    });

    it("accepts custom params", () => {
      const err = new NotFoundError("Custom", "CUSTOM", { resource: "coin" });
      expect(err.category).toBe(ErrorCategory.NOT_FOUND);
      expect(err.code).toBe("CUSTOM");
      expect(err.message).toBe("Custom");
      expect(err.details).toEqual({ resource: "coin" });
    });
  });

  describe("class hierarchy", () => {
    it("ValidationError instanceof DomainError", () => {
      expect(new ValidationError() instanceof DomainError).toBe(true);
    });

    it("NotFoundError instanceof DomainError", () => {
      expect(new NotFoundError() instanceof DomainError).toBe(true);
    });
  });
});
