/**
 * Full posture decision table — unit
 * coverage: every row + edges (widths 599/600/839/840, hinge null/unknown/
 * closed, axis-unknown heuristics).
 */
import * as fc from "fast-check";

import {
  derivePosture,
  heightClassFor,
  widthClassFor,
  type PostureInputs,
} from "./useDevicePosture";

const BASE: PostureInputs = {
  width: 390,
  height: 844,
  hinge: null,
  axis: null,
  bounds: null,
  override: "auto",
};

const partiallyOpen = (angle = 130): PostureInputs["hinge"] => ({ angle, status: "partiallyOpen" });

describe("derivePosture — decision table rows", () => {
  it("row 1: simulator override wins; source=simulator", () => {
    const info = derivePosture({ ...BASE, override: "BOOK_MODE" });
    expect(info.posture).toBe("BOOK_MODE");
    expect(info.source).toBe("simulator");
    expect(info.isDualPane).toBe(true);
  });

  it("row 2: partiallyOpen + horizontal axis → TABLETOP_MODE; source=native", () => {
    const info = derivePosture({
      ...BASE,
      width: 840,
      height: 720,
      hinge: partiallyOpen(),
      axis: "horizontal",
      bounds: { x: 0, y: 360, width: 840, height: 12 },
    });
    expect(info.posture).toBe("TABLETOP_MODE");
    expect(info.hingeAxis).toBe("horizontal");
    expect(info.hingeBounds).toEqual({ x: 0, y: 360, width: 840, height: 12 });
    expect(info.source).toBe("native");
  });

  it("row 3: partiallyOpen + vertical axis + width ≥ 600 → BOOK_MODE", () => {
    const info = derivePosture({
      ...BASE,
      width: 840,
      height: 720,
      hinge: partiallyOpen(),
      axis: "vertical",
      bounds: { x: 420, y: 0, width: 12, height: 720 },
    });
    expect(info.posture).toBe("BOOK_MODE");
    expect(info.isDualPane).toBe(true);
  });

  it("row 3 rejected when width is compact → falls to row 5 COMPACT", () => {
    const info = derivePosture({ ...BASE, width: 390, hinge: partiallyOpen(), axis: "vertical" });
    expect(info.posture).toBe("COMPACT");
    expect(info.isDualPane).toBe(false);
  });

  it("row 4: width ≥ 600 without hinge involvement → FLAT_EXPANDED; source=window", () => {
    const info = derivePosture({ ...BASE, width: 1024, height: 768 });
    expect(info.posture).toBe("FLAT_EXPANDED");
    expect(info.widthClass).toBe("expanded");
    expect(info.source).toBe("window");
  });

  it("row 5: compact width, no hinge → COMPACT", () => {
    const info = derivePosture(BASE);
    expect(info.posture).toBe("COMPACT");
    expect(info.isDualPane).toBe(false);
  });

  it("without native fold axis (axis=null), partiallyOpen hinge does not guess axis and follows size class", () => {
    // Decision 2: In production, layout follows window size classes and never guesses fold axis from aspect ratio.
    const landscapeInfo = derivePosture({
      ...BASE,
      width: 840,
      height: 720,
      hinge: partiallyOpen(),
      axis: null,
    });
    expect(landscapeInfo.posture).toBe("FLAT_EXPANDED");
    expect(landscapeInfo.source).toBe("window");
    expect(landscapeInfo.hingeAxis).toBeNull();

    const portraitInfo = derivePosture({
      ...BASE,
      width: 390,
      height: 844,
      hinge: partiallyOpen(),
      axis: null,
    });
    expect(portraitInfo.posture).toBe("COMPACT");
    expect(portraitInfo.source).toBe("window");
    expect(portraitInfo.hingeAxis).toBeNull();
  });

  it("hinge status=closed never drives rows 2–3 → width ladder only", () => {
    const closed = derivePosture({
      ...BASE,
      width: 840,
      hinge: { angle: 0, status: "closed" },
      axis: "vertical",
    });
    expect(closed.posture).toBe("FLAT_EXPANDED");
    const unknown = derivePosture({
      ...BASE,
      width: 390,
      hinge: { angle: 45, status: "unknown" },
      axis: "vertical",
    });
    expect(unknown.posture).toBe("COMPACT");
  });

  it("size classes: width 599/600/839/840 and height 479/480/899/900", () => {
    expect(derivePosture({ ...BASE, width: 599 }).widthClass).toBe("compact");
    expect(derivePosture({ ...BASE, width: 600 }).widthClass).toBe("medium");
    expect(derivePosture({ ...BASE, width: 839 }).widthClass).toBe("medium");
    expect(derivePosture({ ...BASE, width: 840 }).widthClass).toBe("expanded");
    expect(derivePosture({ ...BASE, height: 479 }).heightClass).toBe("compact");
    expect(derivePosture({ ...BASE, height: 480 }).heightClass).toBe("medium");
    expect(derivePosture({ ...BASE, height: 899 }).heightClass).toBe("medium");
    expect(derivePosture({ ...BASE, height: 900 }).heightClass).toBe("expanded");
  });

  describe("fast-check property-based tests for size classes and layout ladder", () => {
    it("widthClass ladder partitions [0, 4000] strictly monotonically", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 4000 }), (w) => {
          const wc = widthClassFor(w);
          if (w < 600) {
            expect(wc).toBe("compact");
          } else if (w < 840) {
            expect(wc).toBe("medium");
          } else {
            expect(wc).toBe("expanded");
          }
        }),
      );
    });

    it("heightClass ladder partitions [0, 4000] strictly monotonically", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 4000 }), (h) => {
          const hc = heightClassFor(h);
          if (h < 480) {
            expect(hc).toBe("compact");
          } else if (h < 900) {
            expect(hc).toBe("medium");
          } else {
            expect(hc).toBe("expanded");
          }
        }),
      );
    });

    it("production layout (override=auto, axis=null) is pure function of width class", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 200, max: 3000 }),
          fc.integer({ min: 200, max: 3000 }),
          fc.option(
            fc.record({
              angle: fc.integer({ min: 0, max: 180 }),
              status: fc.constantFrom(
                "closed",
                "partiallyOpen",
                "fullyOpen",
                "unknown",
              ) as fc.Arbitrary<"closed" | "partiallyOpen" | "fullyOpen" | "unknown">,
            }),
            { nil: null },
          ),
          (w, h, hinge) => {
            const posture = derivePosture({
              width: w,
              height: h,
              hinge,
              axis: null,
              bounds: null,
              override: "auto",
            });

            if (w < 600) {
              expect(posture.posture).toBe("COMPACT");
              expect(posture.isDualPane).toBe(false);
            } else {
              expect(posture.posture).toBe("FLAT_EXPANDED");
              expect(posture.isDualPane).toBe(true);
            }
          },
        ),
      );
    });
  });
});
