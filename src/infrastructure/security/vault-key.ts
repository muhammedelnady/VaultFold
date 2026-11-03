/**
 * Vault encryption key lifecycle.
 *
 * The key is a 32-character ASCII string (32 bytes, as MMKV's AES-256 mode
 * requires) built from 32 random bytes (expo-crypto), 6 bits of entropy per
 * character (192 bits total). It is stored in expo-secure-store under
 * WHEN_UNLOCKED_THIS_DEVICE_ONLY, so it never leaves the device and is not part
 * of a backup.
 *
 * `ensureVaultKey` never throws and never guesses. It returns a state:
 * - `ready`: key loaded (or created on a genuinely fresh install).
 * - `unavailable`: SecureStore could not be read or written (for example the
 *   device is locked). Nothing was generated or cached; retrying is safe.
 * - `recovery`: the encrypted vault cannot be opened (legacy key format, key
 *   missing while vault data exists, or a corrupt key). The data is
 *   unrecoverable and the user must explicitly reset the vault.
 *
 * Tests inject a deterministic key via `setVaultKeyForTests`.
 */

import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const SECURE_STORE_KEY = "vaultfold.vault.key.v2";
/** v1 held a 64-char hex key, which exceeds MMKV's key limit and used AES-128. */
const LEGACY_SECURE_STORE_KEY = "vaultfold.vault.key.v1";

export const VAULT_KEY_LENGTH = 32;
/** 64 symbols, so `byte & 63` is unbiased. */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const KEY_PATTERN = /^[A-Za-z0-9_-]{32}$/;

export type VaultKeyState =
  | { readonly status: "ready" }
  | { readonly status: "unavailable"; readonly reason: "read-failed" | "persist-failed" }
  | {
      readonly status: "recovery";
      readonly reason: "legacy-key" | "key-missing" | "key-corrupt";
    };

export interface EnsureVaultKeyOptions {
  /** True when an encrypted vault file already exists on disk. */
  readonly vaultDataExists: boolean;
}

let cachedKey: string | null = null;

function generateKey(): string {
  return Array.from(Crypto.getRandomBytes(VAULT_KEY_LENGTH), (byte) => ALPHABET[byte & 63]).join(
    "",
  );
}

export async function ensureVaultKey(options: EnsureVaultKeyOptions): Promise<VaultKeyState> {
  if (cachedKey !== null && KEY_PATTERN.test(cachedKey)) {
    return { status: "ready" };
  }

  let stored: string | null;
  let legacy: string | null;
  try {
    // `?? null`: the native API returns null for a missing key, some mocks return undefined.
    stored =
      (await SecureStore.getItemAsync(SECURE_STORE_KEY, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      })) ?? null;
    legacy =
      stored === null ? ((await SecureStore.getItemAsync(LEGACY_SECURE_STORE_KEY)) ?? null) : null;
  } catch {
    // A read error is not "no key": generating here would orphan existing data.
    return { status: "unavailable", reason: "read-failed" };
  }

  if (stored !== null) {
    if (!KEY_PATTERN.test(stored)) {
      return { status: "recovery", reason: "key-corrupt" };
    }
    cachedKey = stored;
    return { status: "ready" };
  }

  if (legacy !== null) {
    return { status: "recovery", reason: "legacy-key" };
  }

  if (options.vaultDataExists) {
    return { status: "recovery", reason: "key-missing" };
  }

  const fresh = generateKey();
  try {
    await SecureStore.setItemAsync(SECURE_STORE_KEY, fresh, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch {
    // Never use a key that was not persisted: data written with it would be lost.
    return { status: "unavailable", reason: "persist-failed" };
  }
  cachedKey = fresh;
  return { status: "ready" };
}

export function getVaultKey(): string {
  if (cachedKey === null) {
    throw new Error("vault-key: ensureVaultKey() must report ready before the vault opens");
  }
  return cachedKey;
}

export function hasVaultKey(): boolean {
  return cachedKey !== null;
}

/** Deletes the current and legacy keys. The caller must also delete the vault data. */
export async function eraseVaultKey(): Promise<void> {
  cachedKey = null;
  await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
  await SecureStore.deleteItemAsync(LEGACY_SECURE_STORE_KEY);
}

export function setVaultKeyForTests(key: string): void {
  if (!KEY_PATTERN.test(key)) {
    throw new Error("vault-key: key is malformed (expected 32 chars of [A-Za-z0-9_-])");
  }
  cachedKey = key;
}

export function resetCachedKeyForTests(): void {
  cachedKey = null;
}
