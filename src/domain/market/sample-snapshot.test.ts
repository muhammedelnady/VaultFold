/**
 * Unit tests for sample market snapshot fixture generator.
 */

import { describe, expect, it } from "@jest/globals";

import { SAMPLE_MARKETS_SNAPSHOT } from "./sample-snapshot";

describe("SAMPLE_MARKETS_SNAPSHOT", () => {
  it("contains at most 20 coins", () => {
    expect(SAMPLE_MARKETS_SNAPSHOT.length).toBeGreaterThan(0);
    expect(SAMPLE_MARKETS_SNAPSHOT.length).toBeLessThanOrEqual(20);
  });

  it("contains valid market entries with decimal strings", () => {
    const bitcoin = SAMPLE_MARKETS_SNAPSHOT.find((c) => c.id === "bitcoin");
    expect(bitcoin).toBeDefined();
    expect(bitcoin?.symbol).toBe("btc");
    expect(typeof bitcoin?.priceUsd).toBe("string");
    expect(typeof bitcoin?.priceChange24h).toBe("string");
    expect(Array.isArray(bitcoin?.sparkline7d)).toBe(true);
  });
});
