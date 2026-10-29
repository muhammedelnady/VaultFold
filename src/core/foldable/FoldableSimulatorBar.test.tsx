/**
 * Tests for the FoldableSimulatorBar component.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { FoldableSimulatorBar } from "./FoldableSimulatorBar";
import { usePostureOverrideStore } from "./postureStore";

describe("FoldableSimulatorBar", () => {
  it("renders posture options and triggers onPostureChange", async () => {
    const onPostureChange = jest.fn();
    await render(<FoldableSimulatorBar onPostureChange={onPostureChange} />);

    expect(screen.getByText("COMPACT")).toBeDefined();
    expect(screen.getByText("BOOK_MODE")).toBeDefined();

    fireEvent.press(screen.getByText("BOOK_MODE"));
    expect(onPostureChange).toHaveBeenCalledWith("BOOK_MODE");
  });

  it("toggles simulated offline button text on press", async () => {
    const onPostureChange = jest.fn();
    await render(<FoldableSimulatorBar onPostureChange={onPostureChange} />);

    const toggle = screen.getByLabelText("Enable offline mode");
    expect(toggle).toBeDefined();

    fireEvent.press(toggle);
    expect(await screen.findByLabelText("Disable offline mode")).toBeDefined();
  });

  it("writes the posture override store on selection", async () => {
    const onPostureChange = jest.fn();
    await render(<FoldableSimulatorBar onPostureChange={onPostureChange} />);
    fireEvent.press(screen.getByText("TABLETOP_MODE"));
    expect(usePostureOverrideStore.getState().override).toBe("TABLETOP_MODE");
    expect(onPostureChange).toHaveBeenCalledWith("TABLETOP_MODE");
  });

  it("forwards simulated-offline toggles through the callback", async () => {
    const onToggleOffline = jest.fn();
    await render(<FoldableSimulatorBar onToggleOffline={onToggleOffline} />);
    fireEvent.press(screen.getByLabelText("Enable offline mode"));
    expect(onToggleOffline).toHaveBeenCalledWith(true);
    fireEvent.press(await screen.findByLabelText("Disable offline mode"));
    expect(onToggleOffline).toHaveBeenCalledWith(false);
  });

  it("shows the pressed affordance on the offline toggle", async () => {
    await render(<FoldableSimulatorBar onToggleOffline={jest.fn()} />);
    const toggle = screen.getByLabelText("Enable offline mode");
    fireEvent(toggle, "pressIn");
    fireEvent(toggle, "pressOut");
    expect(screen.getByLabelText("Enable offline mode")).toBeTruthy();
  });
});
