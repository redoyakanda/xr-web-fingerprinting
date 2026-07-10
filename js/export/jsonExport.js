export function stringifyFingerprint(fingerprint) {
  return JSON.stringify(normalizeForJson(fingerprint), null, 2);
}

/** Normalizes browser-specific objects and special numeric values before export. */
export function normalizeForJson(value, seen = new WeakSet()) {
  if (value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function' || typeof value === 'symbol') return null;
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (ArrayBuffer.isView(value)) return Array.from(value);
  if (value instanceof ArrayBuffer) return Array.from(new Uint8Array(value));
  if (Array.isArray(value)) return value.map((item) => normalizeForJson(item, seen));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeForJson(item, seen)]));
}

export function downloadFingerprintJson(fingerprint) {
  const json = stringifyFingerprint(fingerprint);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const timestamp = fingerprint.metadata.collectedAt.replace(/[:.]/g, '-');

  anchor.href = url;
  anchor.download = `xr-web-fingerprint-${timestamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyFingerprintJson(fingerprint) {
  await navigator.clipboard.writeText(stringifyFingerprint(fingerprint));
}
