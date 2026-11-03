/**
 * Tests for the PostureSwitcher device posture controls.
 */

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { usePostureOverrideStore, resetPostureOverride } from "./postureStore";
import { PostureSwitcher } from "./PostureSwitcher";

describe("PostureSwitcher", () => {
  beforeEach(() => {
    resetPostureOverride();
  });

  it("renders one chip per posture", async () => {
    await render(<PostureSwitcher />);
    expect(screen.getByText("COMPACT")).toBeTruthy();
    expect(screen.getByText("BOOK_MODE")).toBeTruthy();
    expect(screen.getByText("TABLETOP_MODE")).toBeTruthy();
    expect(screen.getByText("FLAT_EXPANDED")).toBeTruthy();
  });

  it("writes the posture override store on press", async () => {
    const onSelect = jest.fn();
    await render(<PostureSwitcher onSelect={onSelect} />);
    fireEvent.press(screen.getByText("BOOK_MODE"));
    expect(usePostureOverrideStore.getState().override).toBe("BOOK_MODE");
    expect(onSelect).toHaveBeenCalledWith("BOOK_MODE");
  });

  it("applies the supplied tokens to the active chip", async () => {
    resetPostureOverride();
    usePostureOverrideStore.getState().setOverride("TABLETOP_MODE");
    await render(
      <PostureSwitcher
        tokens={{
          chipBackground: "#111111",
          chipActiveBackground: "#222222",
          chipText: "#333333",
          chipActiveText: "#444444",
          chipBorder: "#555555",
          chipActiveBorder: "#666666",
        }}
      />,
    );
    expect(screen.getByText("TABLETOP_MODE")).toBeTruthy();
  });

  it("supports an accessibility label prefix", async () => {
    await render(<PostureSwitcher accessibilityLabelPrefix="Preview" />);
    expect(screen.getByLabelText("Preview COMPACT")).toBeTruthy();
  });
});
