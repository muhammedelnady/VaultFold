import { describe, expect, it } from "@jest/globals";

import { GUTTER_THICKNESS, resolveHingeGutter } from "./hingeGeometry";

describe("resolveHingeGutter", () => {
  it("returns null for postures without a hinge", () => {
    expect(resolveHingeGutter("COMPACT", null, null)).toBeNull();
    expect(resolveHingeGutter("FLAT_EXPANDED", "standard", null)).toBeNull();
  });

  it("uses a thin vertical seam for iPhone Duo", () => {
    expect(resolveHingeGutter("BOOK_MODE", "duo", null)).toEqual({
      axis: "vertical",
      thickness: GUTTER_THICKNESS.duo,
    });
  });

  it("uses a wider vertical crease for a foldable book", () => {
    expect(resolveHingeGutter("BOOK_MODE", "book", null)).toEqual({
      axis: "vertical",
      thickness: GUTTER_THICKNESS.book,
    });
  });

  it("uses a horizontal gutter in tabletop", () => {
    expect(resolveHingeGutter("TABLETOP_MODE", "tabletop", null)).toEqual({
      axis: "horizontal",
      thickness: GUTTER_THICKNESS.tabletop,
    });
  });

  it("falls back to a default thickness for a real fold without a preset", () => {
    expect(resolveHingeGutter("BOOK_MODE", null, null)?.thickness).toBe(GUTTER_THICKNESS.fallback);
  });

  it("prefers measured hinge bounds over presets, with a minimum of 8dp", () => {
    const wide = { x: 100, y: 0, width: 40, height: 800 };
    expect(resolveHingeGutter("BOOK_MODE", "duo", wide)?.thickness).toBe(40);
    const tall = { x: 0, y: 300, width: 800, height: 3 };
    expect(resolveHingeGutter("TABLETOP_MODE", null, tall)?.thickness).toBe(8);
  });

  it("ignores zero-sized bounds and falls back to the preset", () => {
    const empty = { x: 0, y: 0, width: 0, height: 0 };
    expect(resolveHingeGutter("BOOK_MODE", "duo", empty)?.thickness).toBe(GUTTER_THICKNESS.duo);
  });
});
