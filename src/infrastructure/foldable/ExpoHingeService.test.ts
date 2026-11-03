/**
 * Unit tests for ExpoHingeService and StubHingeService.
 */
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as ExpoHinge from "expo-hinge";

import { ExpoHingeService } from "./ExpoHingeService";
import { StubHingeService } from "./StubHingeService";

jest.mock("expo-hinge", () => ({
  isAvailable: jest.fn(),
  getHinge: jest.fn(),
  addHingeListener: jest.fn(),
}));

describe("ExpoHingeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("checks availability and handles exceptions gracefully", () => {
    const service = new ExpoHingeService();
    (ExpoHinge.isAvailable as jest.Mock).mockReturnValueOnce(true);
    expect(service.isAvailable()).toBe(true);

    (ExpoHinge.isAvailable as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Native error");
    });
    expect(service.isAvailable()).toBe(false);
  });

  it("retrieves hinge state and returns null on missing or error", () => {
    const service = new ExpoHingeService();
    (ExpoHinge.getHinge as jest.Mock).mockReturnValueOnce({
      angle: 120,
      status: "partiallyOpen",
    });
    expect(service.getHinge()).toEqual({
      angle: 120,
      status: "partiallyOpen",
    });

    (ExpoHinge.getHinge as jest.Mock).mockReturnValueOnce(null);
    expect(service.getHinge()).toBeNull();

    (ExpoHinge.getHinge as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Native error");
    });
    expect(service.getHinge()).toBeNull();
  });

  it("subscribes to hinge changes and forwards events or removes cleanly", () => {
    const service = new ExpoHingeService();
    const mockRemove = jest.fn();
    const listeners: ((event: {
      hinge: { angle: number; status: "partiallyOpen" } | null;
    }) => void)[] = [];

    (ExpoHinge.addHingeListener as jest.Mock).mockImplementationOnce((cb) => {
      listeners.push(cb as (typeof listeners)[number]);
      return { remove: mockRemove };
    });

    const listener = jest.fn();
    const sub = service.addHingeListener(listener);

    listeners[0]?.({ hinge: { angle: 95, status: "partiallyOpen" } });
    expect(listener).toHaveBeenCalledWith({
      hinge: { angle: 95, status: "partiallyOpen" },
    });

    listeners[0]?.({ hinge: null });
    expect(listener).toHaveBeenCalledWith({ hinge: null });

    sub.remove();
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });

  it("returns no-op subscription when addHingeListener throws", () => {
    const service = new ExpoHingeService();
    (ExpoHinge.addHingeListener as jest.Mock).mockImplementationOnce(() => {
      throw new Error("Failed to subscribe");
    });

    const sub = service.addHingeListener(jest.fn());
    expect(() => sub.remove()).not.toThrow();
  });
});

describe("StubHingeService", () => {
  it("supports setting availability, hinge state, and notifying listeners", () => {
    const stub = new StubHingeService(true, { angle: 180, status: "fullyOpen" });
    expect(stub.isAvailable()).toBe(true);
    expect(stub.getHinge()).toEqual({ angle: 180, status: "fullyOpen" });

    const listener = jest.fn();
    const sub = stub.addHingeListener(listener);

    stub.setHinge({ angle: 90, status: "partiallyOpen" });
    expect(stub.getHinge()).toEqual({ angle: 90, status: "partiallyOpen" });
    expect(listener).toHaveBeenCalledWith({
      hinge: { angle: 90, status: "partiallyOpen" },
    });

    stub.setAvailable(false);
    expect(stub.isAvailable()).toBe(false);

    sub.remove();
    stub.setHinge(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
