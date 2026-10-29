/**
 * Full posture decision table — unit
 * coverage: every row + edges (widths 599/600/839/840, hinge null/unknown/
 * closed, axis-unknown heuristics).
 */
import { derivePosture, type PostureInputs } from "./useDevicePosture";

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

  it("partiallyOpen + unknown axis, landscape viewport → inferred horizontal → TABLETOP; source=heuristic", () => {
    const info = derivePosture({
      ...BASE,
      width: 840,
      height: 720,
      hinge: partiallyOpen(),
      axis: null,
    });
    expect(info.posture).toBe("TABLETOP_MODE");
    expect(info.source).toBe("heuristic");
    expect(info.hingeAxis).toBe("horizontal");
  });

  it("partiallyOpen + unknown axis, portrait viewport → inferred vertical → BOOK (width permitting)", () => {
    const info = derivePosture({
      ...BASE,
      width: 720,
      height: 840,
      hinge: partiallyOpen(),
      axis: null,
    });
    expect(info.posture).toBe("BOOK_MODE");
    expect(info.source).toBe("heuristic");
    expect(info.hingeAxis).toBe("vertical");
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
});
