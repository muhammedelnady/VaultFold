/**
 * Unit tests for resolveNavigationTransition pure routing function.
 */
import { resolveNavigationTransition } from "./navigationResolver";

describe("resolveNavigationTransition", () => {
  it("returns none when staying within compact width", () => {
    const action = resolveNavigationTransition(
      { pathname: "/(tabs)/market", params: {} },
      "compact",
      null,
    );
    expect(action.action).toBe("none");
  });

  it("returns none when staying within expanded width", () => {
    const action = resolveNavigationTransition(
      { pathname: "/(tabs)/market", params: { coinId: "bitcoin" } },
      "expanded",
      "bitcoin",
    );
    expect(action.action).toBe("none");
  });

  it("pushes /market/[coinId] when collapsing to compact while viewing an expanded coin detail", () => {
    const action = resolveNavigationTransition(
      { pathname: "/(tabs)/market", params: { coinId: "ethereum" } },
      "compact",
      "ethereum",
    );
    expect(action.action).toBe("push");
    expect(action.targetPath).toBe("/market/ethereum");
  });

  it("does not push detail on collapse to compact if no coin was actively selected", () => {
    const action = resolveNavigationTransition(
      { pathname: "/(tabs)/market", params: {} },
      "compact",
      null,
    );
    expect(action.action).toBe("none");
  });

  it("replaces /market/[coinId] with /(tabs)/market?coinId=[coinId] when expanding to medium/expanded", () => {
    const action = resolveNavigationTransition(
      { pathname: "/market/solana", params: { coinId: "solana" } },
      "expanded",
      "solana",
    );
    expect(action.action).toBe("replace");
    expect(action.targetPath).toBe("/(tabs)/market");
    expect(action.targetParams).toEqual({ coinId: "solana" });
  });

  it("replaces /market/[coinId] with medium width class as well", () => {
    const action = resolveNavigationTransition(
      { pathname: "/market/solana", params: { coinId: "solana" } },
      "medium",
      "solana",
    );
    expect(action.action).toBe("replace");
    expect(action.targetPath).toBe("/(tabs)/market");
    expect(action.targetParams).toEqual({ coinId: "solana" });
  });

  it("handles fallback to activeSelectedCoinId when params.coinId is absent", () => {
    const action = resolveNavigationTransition(
      { pathname: "/market/cardano", params: {} },
      "expanded",
      "cardano",
    );
    expect(action.action).toBe("replace");
    expect(action.targetParams).toEqual({ coinId: "cardano" });
  });

  it("handles case when neither params.coinId nor activeSelectedCoinId is provided", () => {
    const action = resolveNavigationTransition(
      { pathname: "/market/unknown", params: {} },
      "expanded",
      null,
    );
    expect(action.action).toBe("replace");
    expect(action.targetParams).toBeUndefined();
  });

  it("preserves non-market routes unchanged on size class change", () => {
    const action = resolveNavigationTransition(
      { pathname: "/(tabs)/portfolio", params: {} },
      "expanded",
      null,
    );
    expect(action.action).toBe("none");

    const collapseAction = resolveNavigationTransition(
      { pathname: "/(tabs)/settings", params: {} },
      "compact",
      null,
    );
    expect(collapseAction.action).toBe("none");
  });
});
