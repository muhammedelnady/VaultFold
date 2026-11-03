/**
 * Component tests for StatusChip market status indicator.
 */

import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";

import { StatusChip } from "./StatusChip";

describe("StatusChip", () => {
  it("renders live status", async () => {
    const { getByText } = await render(<StatusChip kind="live" />);
    expect(getByText("Live")).toBeTruthy();
  });

  it("renders cached status with timestamp", async () => {
    const fiveMinutesAgo = Date.now() - 5 * 60_000;
    const { getByText } = await render(<StatusChip kind="cached" lastUpdatedAt={fiveMinutesAgo} />);
    expect(getByText(/Cached • 5m ago/)).toBeTruthy();
  });

  it("renders offline status", async () => {
    const { getByText } = await render(<StatusChip kind="offline" />);
    expect(getByText("Offline")).toBeTruthy();
  });

  it("renders rate_limited status with and without retry time", async () => {
    const { getByText } = await render(<StatusChip kind="rate_limited" retryAfterSeconds={30} />);
    expect(getByText(/Rate-limited • using snapshot \(retry in 30s\)/)).toBeTruthy();

    const withoutTime = await render(<StatusChip kind="rate_limited" />);
    expect(withoutTime.getByText("Rate-limited • using snapshot")).toBeTruthy();
  });

  it("renders sample cold start status", async () => {
    const { getByText } = await render(<StatusChip kind="sample" />);
    expect(getByText("Sample data (offline cold-start)")).toBeTruthy();
  });
});
