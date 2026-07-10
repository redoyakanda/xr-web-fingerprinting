import { normalizeForJson, stableStringify } from '../utils/normalization.js';

export function stringifyFingerprint(fingerprint) { return JSON.stringify(normalizeForJson(fingerprint), null, 2); }
export function sanitizeFilename(name) { return String(name).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 160) || 'fingerprint.json'; }
export function fingerprintFilename(fingerprint) {
  const timestamp = (fingerprint.collectedAtUTC || new Date().toISOString()).replace(/[:.]/g, '-');
  const id = String(fingerprint.collectionId || 'no-id').replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
  return sanitizeFilename(`xr-browser-fingerprint_${timestamp}_${id}.json`);
}
export function buildSummaryExport(fingerprint) {
  const { collectors = {}, ...metadata } = fingerprint;
  return normalizeForJson({ ...metadata, collectors: Object.fromEntries(Object.entries(collectors).map(([name, c]) => [name, { category: c.category, supported: c.supported, warningCount: c.warnings?.length || 0, errorCount: c.errors?.length || 0, durationMs: c.durationMs ?? null }])) });
}
export function prepareExport(payload, type = 'full') {
  if (type === 'summary') return stringifyFingerprint(buildSummaryExport(payload));
  if (type === 'comparison') return JSON.stringify(normalizeForJson(payload), null, 2);
  return stringifyFingerprint(payload);
}
export function downloadJson(payload, filename, type = 'full') {
  const blob = new Blob([prepareExport(payload, type)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = sanitizeFilename(filename); anchor.click(); URL.revokeObjectURL(url);
}
export function downloadFingerprintJson(fingerprint, type = 'full') { downloadJson(fingerprint, type === 'summary' ? `summary_${fingerprintFilename(fingerprint)}` : fingerprintFilename(fingerprint), type); }
export async function copyFingerprintJson(fingerprint) { await writeClipboard(stringifyFingerprint(fingerprint)); }
export async function copySummary(fingerprint) { await writeClipboard(JSON.stringify(buildSummaryExport(fingerprint), null, 2)); }
async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const area = document.createElement('textarea'); area.value = text; document.body.append(area); area.select(); document.execCommand('copy'); area.remove();
}
export { stableStringify };
