/**
 * Unit tests for Largest Triangle Three Buckets (LTTB) downsampling algorithm.
 */

import { describe, expect, it } from "@jest/globals";

import { buildSparklineSvgPath, downsampleLTTB } from "./lttb";

describe("LTTB downsampling", () => {
  it("returns original data if length <= threshold", () => {
    const data = [10, 20, 30, 40, 50];
    expect(downsampleLTTB(data, 10)).toEqual(data);
    expect(downsampleLTTB(data, 5)).toEqual(data);
  });

  it("returns original data if threshold <= 2", () => {
    const data = [10, 20, 30, 40, 50];
    expect(downsampleLTTB(data, 2)).toEqual(data);
    expect(downsampleLTTB(data, 1)).toEqual(data);
  });

  it("downsamples array to exact threshold length", () => {
    const data = Array.from({ length: 168 }, (_, i) => Math.sin(i / 10) * 100 + 500);
    const downsampled = downsampleLTTB(data, 40);

    expect(downsampled).toHaveLength(40);
    expect(downsampled[0]).toBe(data[0]);
    expect(downsampled[downsampled.length - 1]).toBe(data[data.length - 1]);
  });

  it("preserves prominent peak", () => {
    const data = [10, 10, 10, 10, 1000, 10, 10, 10, 10, 10];
    const downsampled = downsampleLTTB(data, 4);

    expect(downsampled).toHaveLength(4);
    expect(downsampled).toContain(1000);
  });
});

describe("buildSparklineSvgPath", () => {
  it("returns empty string for empty data", () => {
    expect(buildSparklineSvgPath([], 100, 40)).toBe("");
  });

  it("draws a horizontal middle line for a single data point", () => {
    expect(buildSparklineSvgPath([50], 100, 40)).toBe("M 0 20 L 100 20");
  });

  it("draws a horizontal line when all points are identical (flatline)", () => {
    const path = buildSparklineSvgPath([100, 100, 100], 60, 20, 2);
    expect(path).toContain("M 0 10");
    expect(path).toContain("L 60 10");
  });

  it("builds valid SVG path coordinates for normal trend", () => {
    const path = buildSparklineSvgPath([10, 20, 15, 30], 90, 30, 2);
    expect(path.startsWith("M 0 ")).toBe(true);
    expect(path).toContain("L 30 ");
    expect(path).toContain("L 60 ");
    expect(path).toContain("L 90 ");
  });
});
