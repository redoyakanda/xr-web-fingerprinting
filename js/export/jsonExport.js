export function stringifyFingerprint(fingerprint) {
  return JSON.stringify(fingerprint, null, 2);
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
