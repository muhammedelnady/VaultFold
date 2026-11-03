/**
 * `SimulatedLedgerRemote`.
 *
 * A tiny MMKV-backed "server" implementing `LedgerRemote`. Kept in the Data
 * layer so the domain only sees the port; DI binds the interface, and a real
 * API implementation can replace this file without any domain change.
 *
 * Semantics:
 * - `push` is idempotent: replays of a `clientMutationId` already applied are
 * no-ops (exactly-once at the storage level, same guarantee a real server
 * would give with its dedup table).
 * - `pull(sinceVersion)` returns records the "server" has not reported before.
 * - `wipe` gives the E2E/dev reset a deterministic starting constellation.
 */

import { getRemoteSimArea, type MmkvArea } from "@core/offline/storage-areas";
import type { AppError } from "@domain/errors";
import type {
  LedgerPullResponse,
  LedgerRemote,
  ServerMutationRecord,
} from "@domain/remote/LedgerRemote";
import { ok, type Result } from "@domain/Result";
import type {
  OutboxEntry,
  OutboxPayloadForType,
  OutboxEntryType,
} from "@domain/sync/outbox-contract";

const VERSION_KEY = "ledger/version";
const RECORDS_KEY = "ledger/records";

interface StoredRecord extends ServerMutationRecord {
  readonly serverVersion: number;
}

function readRecords(area: MmkvArea): StoredRecord[] {
  const raw = area.getString(RECORDS_KEY);
  if (raw === undefined) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredRecord[];
  } catch {
    return [];
  }
}

function recordFor(entry: OutboxEntry): ServerMutationRecord {
  return {
    clientMutationId: entry.id,
    type: entry.type,
    payload: entry.payload as OutboxPayloadForType<OutboxEntryType>,
    appliedAt: Date.now(),
  };
}

export function createSimulatedLedgerRemote(area: MmkvArea = getRemoteSimArea()): LedgerRemote {
  const push = (mutations: readonly OutboxEntry[]): Promise<Result<number, AppError>> => {
    const existing = readRecords(area);
    const known = new Set(existing.map((record) => record.clientMutationId));
    let version = Number(area.getString(VERSION_KEY) ?? "0");
    let applied = 0;

    for (const entry of mutations) {
      if (known.has(entry.id)) continue;
      version += 1;
      applied += 1;
      existing.push({ ...recordFor(entry), serverVersion: version });
    }

    if (applied > 0) {
      area.set(VERSION_KEY, String(version));
      area.set(RECORDS_KEY, JSON.stringify(existing));
    }
    return Promise.resolve(ok(applied));
  };

  const pull = (sinceVersion: number): Promise<Result<LedgerPullResponse, AppError>> => {
    const all = readRecords(area);
    const fresh = all.filter((record) => record.serverVersion > sinceVersion);
    const version = Number(area.getString(VERSION_KEY) ?? "0");
    return Promise.resolve(ok({ version, mutations: fresh }));
  };

  return { push, pull };
}

export function wipeSimulatedLedger(area: MmkvArea = getRemoteSimArea()): void {
  area.remove(VERSION_KEY);
  area.remove(RECORDS_KEY);
}

export function setupSimulatedLedgerRemote(
  _remote: ReturnType<typeof createSimulatedLedgerRemote>,
): void {}

export async function seedSimulatedLedger(
  remote: ReturnType<typeof createSimulatedLedgerRemote>,
  entries: readonly OutboxEntry[],
): Promise<void> {
  await remote.push(entries);
}
