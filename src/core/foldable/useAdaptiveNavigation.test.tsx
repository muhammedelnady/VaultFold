/**
 * Unit tests for useAdaptiveNavigation hook.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";

import { usePostureOverrideStore } from "./postureStore";
import { useAdaptiveNavigation } from "./useAdaptiveNavigation";
import type { DevicePosture } from "./useDevicePosture";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

interface HookProps {
  readonly override: DevicePosture;
}

describe("useAdaptiveNavigation", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    (usePathname as jest.Mock).mockReturnValue("/market/ethereum");
    (useLocalSearchParams as jest.Mock).mockReturnValue({ coinId: "ethereum" });
    usePostureOverrideStore.getState().setOverride("COMPACT");
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not navigate when width class does not change", async () => {
    await renderHook(() => useAdaptiveNavigation({ debounceMs: 50 }));

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("replaces route with master-detail list when expanding from compact to expanded", async () => {
    const { rerender } = await renderHook<void, HookProps>(
      ({ override }: HookProps) =>
        useAdaptiveNavigation({ debounceMs: 50, postureOverride: override }),
      { initialProps: { override: "COMPACT" } },
    );

    await rerender({ override: "FLAT_EXPANDED" });

    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(tabs)/market",
      params: { coinId: "ethereum" },
    });
  });

  it("pushes detail route when collapsing from expanded to compact with selected coin", async () => {
    (usePathname as jest.Mock).mockReturnValue("/(tabs)/market");
    (useLocalSearchParams as jest.Mock).mockReturnValue({ coinId: "solana" });

    const { rerender } = await renderHook<void, HookProps>(
      ({ override }: HookProps) =>
        useAdaptiveNavigation({ debounceMs: 50, postureOverride: override }),
      { initialProps: { override: "FLAT_EXPANDED" } },
    );

    await rerender({ override: "COMPACT" });

    expect(mockPush).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(mockPush).toHaveBeenCalledWith("/market/solana");
  });

  it("cancels debounce timer if unmounted or overridden before delay", async () => {
    const { rerender, unmount } = await renderHook<void, HookProps>(
      ({ override }: HookProps) =>
        useAdaptiveNavigation({ debounceMs: 100, postureOverride: override }),
      { initialProps: { override: "COMPACT" } },
    );

    await rerender({ override: "FLAT_EXPANDED" });
    await unmount();

    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("uses default debounce when options are not provided", async () => {
    const { rerender } = await renderHook<void, HookProps>(
      ({ override }: HookProps) => useAdaptiveNavigation({ postureOverride: override }),
      { initialProps: { override: "COMPACT" } },
    );

    await rerender({ override: "FLAT_EXPANDED" });

    await act(async () => {
      jest.advanceTimersByTime(140);
    });
    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(20);
    });
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/(tabs)/market",
      params: { coinId: "ethereum" },
    });
  });

  it("does not navigate on unrelated routes where action is none", async () => {
    (usePathname as jest.Mock).mockReturnValue("/settings");
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { rerender } = await renderHook<void, HookProps>(
      ({ override }: HookProps) =>
        useAdaptiveNavigation({ debounceMs: 50, postureOverride: override }),
      { initialProps: { override: "COMPACT" } },
    );

    await rerender({ override: "FLAT_EXPANDED" });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("prioritizes explicit activeCoinId from options", async () => {
    (usePathname as jest.Mock).mockReturnValue("/(tabs)/market");
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { rerender } = await renderHook<void, HookProps>(
      ({ override }: HookProps) =>
        useAdaptiveNavigation({
          debounceMs: 50,
          postureOverride: override,
          activeCoinId: "bitcoin",
        }),
      { initialProps: { override: "FLAT_EXPANDED" } },
    );

    await rerender({ override: "COMPACT" });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(mockPush).toHaveBeenCalledWith("/market/bitcoin");
  });

  it("cancels active timer when width class changes before delay", async () => {
    const { rerender } = await renderHook<void, HookProps>(
      ({ override }: HookProps) =>
        useAdaptiveNavigation({ debounceMs: 100, postureOverride: override }),
      { initialProps: { override: "COMPACT" } },
    );

    await rerender({ override: "FLAT_EXPANDED" });

    await act(async () => {
      jest.advanceTimersByTime(50);
    });

    // Rapidly switch back to COMPACT before 100ms expires
    await rerender({ override: "COMPACT" });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Replace from the first transition was aborted!
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
