/**
 * Component tests for ThemePreviewCard theme swatch component.
 */

import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";

import { ThemePreviewCard } from "./ThemePreviewCard";

describe("ThemePreviewCard", () => {
  it("renders the live preview canvas", async () => {
    await render(<ThemePreviewCard />);
    expect(screen.getByTestId("theme-preview-card")).toBeTruthy();
  });
});
