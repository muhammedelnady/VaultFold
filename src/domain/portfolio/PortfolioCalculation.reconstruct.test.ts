/**
 * Unit tests for reconstructing active ledger entries from append-only revisions and tombstones.
 */

import { describe, expect, it } from "@jest/globals";

import type { LedgerEntry } from "@domain/ledger/LedgerEntry";

import { reconstructActiveLedgerEntries } from "./PortfolioCalculation";

describe("reconstructActiveLedgerEntries", () => {
  it("resolves append-only revisions and tombstones", () => {
    const entries: LedgerEntry[] = [
      {
        id: "tx-1",
        type: "buy",
        coinId: "bitcoin",
        amount: "1.0",
        price: "60000",
        currency: "usd",
        timestamp: 1000,
      },
      {
        id: "tx-2",
        type: "buy",
        coinId: "ethereum",
        amount: "10.0",
        price: "3000",
        currency: "usd",
        timestamp: 2000,
      },
      {
        id: "tx-3",
        prevId: "tx-1",
        type: "buy",
        coinId: "bitcoin",
        amount: "1.5",
        price: "60000",
        currency: "usd",
        timestamp: 3000,
      },
      {
        id: "tx-4",
        prevId: "tx-2",
        type: "tombstone",
        coinId: "ethereum",
        amount: "10.0",
        price: "3000",
        currency: "usd",
        timestamp: 4000,
      },
    ];

    const active = reconstructActiveLedgerEntries(entries);
    expect(active.length).toBe(1);
    expect(active[0]!.id).toBe("tx-3");
    expect(active[0]!.amount).toBe("1.5");
  });
});
