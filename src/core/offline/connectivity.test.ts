/**
 * Tests for the network Connectivity service and listener notifications.
 */

import { describe, expect, it, jest } from "@jest/globals";

import { Connectivity } from "./connectivity";

describe("Connectivity", () => {
  it("defaults to real probe status or true", () => {
    const online = new Connectivity({ read: () => true });
    expect(online.isOnline()).toBe(true);
    expect(online.isReallyOnline()).toBe(true);
    expect(online.isSimulatedOffline()).toBe(false);

    const offline = new Connectivity({ read: () => false });
    expect(offline.isOnline()).toBe(false);
    expect(offline.isReallyOnline()).toBe(false);
  });

  it("calculates effectiveOnline = realOnline && !simulatedOffline", () => {
    const conn = new Connectivity({ read: () => true });
    expect(conn.isOnline()).toBe(true);

    conn.setSimulatedOffline(true);
    expect(conn.isSimulatedOffline()).toBe(true);
    expect(conn.isReallyOnline()).toBe(true);
    expect(conn.isOnline()).toBe(false);

    conn.setSimulatedOffline(false);
    expect(conn.isOnline()).toBe(true);

    conn.setRealOnline(false);
    expect(conn.isReallyOnline()).toBe(false);
    expect(conn.isOnline()).toBe(false);
  });

  it("notifies listeners on connectivity state change", () => {
    const conn = new Connectivity({ read: () => true });
    const listener = jest.fn();
    const unsubscribe = conn.subscribe(listener);

    conn.setSimulatedOffline(true);
    expect(listener).toHaveBeenCalledWith(false);

    conn.setSimulatedOffline(false);
    expect(listener).toHaveBeenCalledWith(true);

    unsubscribe();
    conn.setSimulatedOffline(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("notifies onlineManagerHooks immediately and on change", () => {
    const conn = new Connectivity({ read: () => true });
    const hook = jest.fn();

    const unsub = conn.addOnlineManagerHook(hook);
    expect(hook).toHaveBeenCalledWith(true);

    conn.setRealOnline(false);
    expect(hook).toHaveBeenCalledWith(false);

    unsub();
  });

  it("ignores redundant state transitions", () => {
    const conn = new Connectivity({ read: () => true });
    const listener = jest.fn();
    conn.subscribe(listener);

    conn.setRealOnline(true);
    expect(listener).not.toHaveBeenCalled();

    conn.setSimulatedOffline(false);
    expect(listener).not.toHaveBeenCalled();
  });
});
