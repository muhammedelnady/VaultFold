/**
 * Connectivity:
 * `effectiveOnline = realOnline && !simulatedOffline`.
 *
 * The device's real state comes from @react-native-community/netinfo;
 * the simulator toggle rides the **same** code path:
 * flipping it updates `onlineManager` (TanStack), makes HttpClient fail fast
 * with `Offline`, and pauses the outbox flusher.
 */

export type ConnectivityListener = (online: boolean) => void;

export interface RealNetworkProbe {
  readonly read: () => boolean;
}

export class Connectivity {
  private simulatedOffline: boolean;
  private realOnline: boolean;
  private readonly listeners = new Set<ConnectivityListener>();

  private readonly onlineManagerHooks = new Set<ConnectivityListener>();

  public constructor(probe?: RealNetworkProbe) {
    this.realOnline = probe?.read() ?? true;
    this.simulatedOffline = false;
  }

  public isOnline(): boolean {
    return this.realOnline && !this.simulatedOffline;
  }

  public isSimulatedOffline(): boolean {
    return this.simulatedOffline;
  }

  public isReallyOnline(): boolean {
    return this.realOnline;
  }

  public setSimulatedOffline(value: boolean): void {
    if (this.simulatedOffline === value) {
      return;
    }
    this.simulatedOffline = value;
    this.notify();
  }

  public setRealOnline(value: boolean): void {
    if (this.realOnline === value) {
      return;
    }
    this.realOnline = value;
    this.notify();
  }

  public subscribe(listener: ConnectivityListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public addOnlineManagerHook(listener: ConnectivityListener): () => void {
    this.onlineManagerHooks.add(listener);
    listener(this.isOnline());
    return () => {
      this.onlineManagerHooks.delete(listener);
    };
  }

  private notify(): void {
    const online = this.isOnline();
    for (const listener of this.listeners) {
      listener(online);
    }
    for (const hook of this.onlineManagerHooks) {
      hook(online);
    }
  }
}
