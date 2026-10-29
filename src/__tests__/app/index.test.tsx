/**
 * Integration tests for the native tab layout.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { ReactNode } from "react";

import TabsLayout from "../../app/(tabs)/_layout";

jest.mock("expo-router/native-tabs", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  const Label = ({ children }: { children?: ReactNode }) =>
    React.createElement(Text, null, children);
  const Icon = () => null;
  const Badge = () => null;
  const Trigger = Object.assign(
    ({ name, children }: { name: string; children?: ReactNode }) =>
      React.createElement(View, { testID: `native-tab-${name}` }, children),
    { Label, Icon, Badge },
  );
  const NativeTabs = Object.assign(
    ({ children }: { children?: ReactNode }) =>
      React.createElement(View, { testID: "native-tabs" }, children),
    { Trigger },
  );

  return { NativeTabs };
});

describe("Native tabs layout", () => {
  it("renders all four tabs with their labels", async () => {
    const { getByTestId, getByText } = await render(<TabsLayout />);

    expect(getByTestId("native-tabs")).toBeTruthy();
    expect(getByTestId("native-tab-market")).toBeTruthy();
    expect(getByTestId("native-tab-portfolio")).toBeTruthy();
    expect(getByTestId("native-tab-alerts")).toBeTruthy();
    expect(getByTestId("native-tab-settings")).toBeTruthy();

    expect(getByText("Market")).toBeTruthy();
    expect(getByText("Portfolio")).toBeTruthy();
    expect(getByText("Alerts")).toBeTruthy();
    expect(getByText("Settings")).toBeTruthy();
  });
});
