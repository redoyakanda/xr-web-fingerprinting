/**
 * Shared utility helpers for fingerprint collection modules.
 * Keep this file generic so future modules can reuse the same conventions.
 */

/** Safely evaluates a property getter and normalizes thrown errors. */
export function safeRead(getter) {
  try {
    const value = getter();
    return value === undefined ? null : value;
  } catch (error) {
    return {
      unavailable: true,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Converts array-like browser objects into plain arrays. */
export function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.from(value);
}

/** Returns an ISO-8601 timestamp for collection metadata. */
export function createTimestamp() {
  return new Date().toISOString();
}

/** Creates the standard collector response envelope used by all modules. */
export function createCollectorResult(category, supported, values = {}, warnings = [], errors = []) {
  return {
    category,
    supported,
    values,
    warnings,
    errors,
  };
}

/** Creates a stable SHA-256 hash for deterministic fingerprint payloads. */
export async function sha256Hash(value) {
  if (!window.crypto?.subtle) {
    throw new Error('Web Crypto API is unavailable for hashing.');
  }

  const encoded = new TextEncoder().encode(String(value));
  const digest = await window.crypto.subtle.digest('SHA-256', encoded);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
