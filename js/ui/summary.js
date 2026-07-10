import { countLeafValues, normalizeForJson } from '../utils/normalization.js';

export const SCHEMA_VERSION = '1.0.0';
export const APPLICATION_VERSION = '0.7.0';
export const ETHICS_NOTICE = 'Research prototype: browser-exposed fingerprinting features are collected and compared locally; no uniqueness claims are made.';

export function createCollectionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function getPageOrigin() {
  try { return globalThis.location?.origin || 'unknown-origin'; } catch { return 'unknown-origin'; }
}

export function buildFingerprint({ collectorResults, startedAt, endedAt, debugMode = false }) {
  const collectors = Object.fromEntries(Object.entries(collectorResults).map(([name, result]) => [name, normalizeCollector(name, result, debugMode)]));
  const collectorValues = Object.values(collectors);
  const warningCount = collectorValues.reduce((sum, c) => sum + c.warnings.length, 0);
  const errorCount = collectorValues.reduce((sum, c) => sum + c.errors.length, 0);
  const unsupportedCollectorCount = collectorValues.filter((c) => !c.supported).length;
  const successfulCollectorCount = collectorValues.filter((c) => c.supported && c.errors.length === 0).length;
  return normalizeForJson({
    schemaVersion: SCHEMA_VERSION,
    applicationVersion: APPLICATION_VERSION,
    collectionId: createCollectionId(),
    collectedAtUTC: endedAt.toISOString(),
    collectionDurationMs: endedAt - startedAt,
    collectionStatus: getCollectionStatus(collectorValues),
    secureContext: Boolean(globalThis.isSecureContext ?? globalThis.window?.isSecureContext),
    pageURLOrigin: getPageOrigin(),
    collectorCount: collectorValues.length,
    successfulCollectorCount,
    unsupportedCollectorCount,
    warningCount,
    errorCount,
    totalValuesCollected: countLeafValues(collectors),
    ethicsNotice: ETHICS_NOTICE,
    collectorManifest: Object.keys(collectors).map((name) => ({ name, version: APPLICATION_VERSION })),
    categorySummaries: buildCategorySummaries(collectors),
    collectors,
  }, { includeErrorStacks: debugMode });
}

export function normalizeCollector(name, result, debugMode = false) {
  const errors = (result.errors || []).map((error) => typeof error === 'string' ? { collector: name, message: error, type: 'CollectorError', stage: 'collection', continued: true } : error);
  return normalizeForJson({ category: result.category || name, supported: Boolean(result.supported), values: result.values || {}, warnings: result.warnings || [], errors, durationMs: result.durationMs ?? null, timedOut: Boolean(result.timedOut) }, { includeErrorStacks: debugMode });
}

export function buildCategorySummaries(collectors) {
  return Object.fromEntries(Object.entries(collectors).map(([name, c]) => [name, { supported: c.supported, warningCount: c.warnings.length, errorCount: c.errors.length, valueCount: countLeafValues(c.values) }]));
}

function getCollectionStatus(collectors) {
  if (!collectors.length || collectors.every((c) => c.errors.length > 0 && !c.supported)) return 'failed';
  if (collectors.some((c) => c.errors.length > 0 || c.timedOut)) return 'partial';
  if (collectors.some((c) => c.warnings.length > 0 || !c.supported)) return 'completed-with-warnings';
  return 'completed';
}
