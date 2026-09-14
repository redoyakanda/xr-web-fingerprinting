import { countLeafValues, normalizeForJson } from '../utils/normalization.js';
import { buildFeatureVector } from '../analysis/featureVector.js';

export const SCHEMA_VERSION = '2.0.0';
export const APPLICATION_VERSION = '1.2.0';
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

export function buildFingerprint({ collectorResults, startedAt, endedAt, debugMode = false, extensionArtifactObservation = null, interactionExperiment = null }) {
  const collectors = Object.fromEntries(Object.entries(collectorResults).map(([name, result]) => [name, normalizeCollector(name, result, debugMode)]));
  const collectorValues = Object.values(collectors);
  const warningCount = collectorValues.reduce((sum, c) => sum + c.warnings.length, 0);
  const errorCount = collectorValues.reduce((sum, c) => sum + c.errors.length, 0);
  const unsupportedCollectorCount = collectorValues.filter((c) => !c.supported).length;
  const successfulCollectorCount = collectorValues.filter((c) => c.supported && c.errors.length === 0).length;
  const collectionId = createCollectionId();
  const metadata = { schemaVersion: SCHEMA_VERSION, applicationVersion: APPLICATION_VERSION, collectionId,
    collectedAtUTC: endedAt.toISOString(), secureContext: Boolean(globalThis.isSecureContext ?? globalThis.window?.isSecureContext), pageURLOrigin: getPageOrigin() };
  const record = {
    metadata,
    // Compatibility aliases are retained for existing Phase A-C exports and import tools.
    ...metadata,
    collectionDurationMs: endedAt - startedAt,
    collectionStatus: getCollectionStatus(collectorValues),
    collectorCount: collectorValues.length,
    successfulCollectorCount,
    unsupportedCollectorCount,
    warningCount,
    errorCount,
    totalValuesCollected: countLeafValues(collectors),
    ethicsNotice: ETHICS_NOTICE,
    screenReaderDetectionModelStatus: 'not-trained',
    classification: null,
    // Detach the compatibility alias so JSON normalization does not mistake the
    // intentionally duplicated tree for a circular reference.
    passiveSnapshot: { performed: true, timing: { startedAt: startedAt.toISOString(), finishedAt: endedAt.toISOString(), durationMs: endedAt-startedAt }, collectors: JSON.parse(JSON.stringify(collectors)) },
    extensionArtifactObservation: extensionArtifactObservation || { performed: false, supported: null, timing: { startedAt: null, finishedAt: null, durationMs: null, configuredDurationMs: 2000 }, observerDisconnected: false, aggregateFeatures: {} },
    interactionExperiment: interactionExperiment || { performed: false, groundTruth: {}, timing: { startedAt: null, finishedAt: null, durationMs: null }, tasks: [], aggregateFeatures: {}, rawEventsIncluded: false },
    collectorManifest: Object.keys(collectors).map((name) => ({ name, version: APPLICATION_VERSION })),
    categorySummaries: buildCategorySummaries(collectors),
    collectors,
    accessibilitySummary: { screenReaderDetectionModelStatus: 'not-trained', classification: null },
  };
  record.featureGroups = buildFeatureVector(record);
  return normalizeForJson(record, { includeErrorStacks: debugMode });
}

/** Create an exportable session before any passive collectors have run. */
export function buildResearchRecord({ passiveRecord = null, extensionArtifactObservation = null, interactionExperiment = null } = {}) {
  if (passiveRecord) return refreshDerivedRecord({
    ...passiveRecord,
    extensionArtifactObservation: extensionArtifactObservation || emptyExtensionObservation(),
    interactionExperiment: interactionExperiment || emptyInteractionExperiment(),
  });
  const now = new Date().toISOString();
  const metadata = { schemaVersion: SCHEMA_VERSION, applicationVersion: APPLICATION_VERSION, collectionId: createCollectionId(), collectedAtUTC: now, secureContext: Boolean(globalThis.isSecureContext ?? globalThis.window?.isSecureContext), pageURLOrigin: getPageOrigin() };
  const record = {
    metadata, ...metadata, collectionDurationMs: null, collectionStatus: 'not-performed', collectorCount: 0,
    successfulCollectorCount: 0, unsupportedCollectorCount: 0, warningCount: 0, errorCount: 0,
    totalValuesCollected: 0, ethicsNotice: ETHICS_NOTICE, screenReaderDetectionModelStatus: 'not-trained', classification: null,
    passiveSnapshot: { performed: false, timing: { startedAt: null, finishedAt: null, durationMs: null }, collectors: {} },
    extensionArtifactObservation: extensionArtifactObservation || emptyExtensionObservation(),
    interactionExperiment: interactionExperiment || emptyInteractionExperiment(),
    collectorManifest: [], categorySummaries: {}, collectors: {}, accessibilitySummary: { screenReaderDetectionModelStatus: 'not-trained', classification: null },
  };
  record.featureGroups = buildFeatureVector(record);
  return normalizeForJson(record);
}

function emptyExtensionObservation() { return { performed: false, supported: null, timing: { startedAt: null, finishedAt: null, durationMs: null, configuredDurationMs: 2000 }, observerDisconnected: false, aggregateFeatures: {}, warnings: [], errors: [] }; }
function emptyInteractionExperiment() { return { performed: false, groundTruth: {}, timing: { startedAt: null, finishedAt: null, durationMs: null }, tasks: [], aggregateFeatures: {}, rawEventsIncluded: false }; }

/** Rebuild derived groups after a bounded observation or interaction result changes. */
export function refreshDerivedRecord(record) {
  return normalizeForJson({ ...record, featureGroups: buildFeatureVector(record), accessibilitySummary: { screenReaderDetectionModelStatus: 'not-trained', classification: null } });
}

/** Validate the stable, top-level research-record contract before local export/import. */
export function validateResearchRecord(record) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { valid: false, errors: ['record must be an object'] };
  for (const section of ['metadata','passiveSnapshot','extensionArtifactObservation','interactionExperiment','featureGroups','accessibilitySummary']) {
    if (!record[section] || typeof record[section] !== 'object' || Array.isArray(record[section])) errors.push(`${section} must be an object`);
  }
  if (record.metadata?.schemaVersion !== SCHEMA_VERSION) errors.push(`metadata.schemaVersion must be ${SCHEMA_VERSION}`);
  const timestampPaths = ['metadata.collectedAtUTC'];
  if (record.passiveSnapshot?.performed) timestampPaths.push('passiveSnapshot.timing.startedAt','passiveSnapshot.timing.finishedAt');
  for (const path of timestampPaths) {
    const value = path.split('.').reduce((item, key) => item?.[key], record);
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value)) || !value.endsWith('Z')) errors.push(`${path} must be a UTC ISO timestamp`);
  }
  if (typeof record.passiveSnapshot?.performed !== 'boolean') errors.push('passiveSnapshot.performed must be boolean');
  if (record.screenReaderDetectionModelStatus !== 'not-trained' || record.classification !== null) errors.push('classifier status must remain not-trained with null classification');
  return { valid: errors.length === 0, errors };
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
