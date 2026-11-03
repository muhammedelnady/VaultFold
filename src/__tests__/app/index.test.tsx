/**
 * Integration tests for the tab layout.
 */

import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { ReactNode } from "react";

import TabsLayout from "../../app/(tabs)/_layout";

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  const Screen = ({
    name,
    options,
  }: {
    name: string;
    options?: {
      tabBarLabel?: string;
      tabBarButtonTestID?: string;
      tabBarIcon?: (props: { color: string; size: number }) => ReactNode;
    };
  }) =>
    React.createElement(
      View,
      { testID: options?.tabBarButtonTestID ?? `tab-${name}` },
      React.createElement(Text, null, options?.tabBarLabel ?? name),
      options?.tabBarIcon?.({ color: "#000", size: 24 }),
    );

  const Tabs = Object.assign(
    ({ children }: { children?: ReactNode }) =>
      React.createElement(View, { testID: "bottom-tabs" }, children),
    { Screen },
  );

  return { Tabs };
});

describe("Bottom tabs layout", () => {
  it("renders all four tabs with their labels and testIDs", async () => {
    const { getByTestId, getByText } = await render(<TabsLayout />);

    expect(getByTestId("bottom-tabs")).toBeTruthy();
    expect(getByTestId("tabs.market")).toBeTruthy();
    expect(getByTestId("tabs.vault")).toBeTruthy();
    expect(getByTestId("tabs.alerts")).toBeTruthy();
    expect(getByTestId("tabs.settings")).toBeTruthy();

    expect(getByText("Market")).toBeTruthy();
    expect(getByText("Portfolio")).toBeTruthy();
    expect(getByText("Alerts")).toBeTruthy();
    expect(getByText("Settings")).toBeTruthy();
  });
});
