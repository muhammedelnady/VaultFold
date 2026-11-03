/**
 * Unit tests for E2E fixtures and deterministic test doubles.
 */

import { E2EFixtures } from "./fixtures";

describe("E2EFixtures", () => {
  it("provides deterministic biometric success", () => {
    expect(E2EFixtures.biometricResult).toEqual({
      success: true,
      error: undefined,
    });
  });

  it("returns static fixture for ping", async () => {
    const res = await E2EFixtures.httpClient.get("https://api.coingecko.com/api/v3/ping");
    expect(res.kind).toBe("ok");
    if (res.kind === "ok") {
      expect(res.value.status).toBe(200);
      expect(res.value.json).toEqual({ gecko_says: "(V3) To the Moon!" });
    }
  });

  it("returns static fixture for markets", async () => {
    const res = await E2EFixtures.httpClient.get(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd",
    );
    expect(res.kind).toBe("ok");
    if (res.kind === "ok") {
      expect(Array.isArray(res.value.json)).toBe(true);
    }
  });

  it("returns static fixture for coin detail (e.g. bitcoin)", async () => {
    const res = await E2EFixtures.httpClient.get("https://api.coingecko.com/api/v3/coins/bitcoin");
    expect(res.kind).toBe("ok");
    if (res.kind === "ok") {
      const data = res.value.json as { id?: string };
      expect(data.id).toBe("bitcoin");
    }
  });

  it("returns static fixture for market charts with different days", async () => {
    const res1d = await E2EFixtures.httpClient.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?days=1",
    );
    expect(res1d.kind).toBe("ok");

    const res7d = await E2EFixtures.httpClient.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?days=7",
    );
    expect(res7d.kind).toBe("ok");

    const res30d = await E2EFixtures.httpClient.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?days=30",
    );
    expect(res30d.kind).toBe("ok");

    const res365d = await E2EFixtures.httpClient.get(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?days=365",
    );
    expect(res365d.kind).toBe("ok");
  });

  it("returns not-found for unknown endpoints", async () => {
    const res = await E2EFixtures.httpClient.get(
      "https://api.coingecko.com/api/v3/unknown/random/endpoint",
    );
    expect(res.kind).toBe("err");
    if (res.kind === "err") {
      expect(res.error.kind).toBe("not-found");
    }
  });

  it("returns error for post requests", async () => {
    const res = await E2EFixtures.httpClient.post();
    expect(res.kind).toBe("err");
    if (res.kind === "err") {
      expect(res.error.kind).toBe("http");
    }
  });
});
