import { stableStringify, normalizeForJson } from '../utils/normalization.js';

export const VOLATILE_PATH_PATTERNS = [
  /^\$\.collectedAtUTC$/, /^\$\.collectionDurationMs$/, /^\$\.collectionId$/, /^\$\.generatedFilename$/,
  /^\$\.metadata\.collectedAt$/, /^\$\.metadata\.sessionId$/, /durationMs$/, /elapsed/i, /temp(orary)?Name/i, /stack$/i,
  /^\$\.collectors\.[^.]+\.errors\.\d+\.stack$/,
];

export function validateFingerprintJson(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Imported JSON must be an object.');
  if (!value.collectors && !Object.values(value).some((entry) => entry && typeof entry === 'object' && 'supported' in entry)) throw new Error('Imported JSON does not look like a fingerprint result.');
  return true;
}

export function compareFingerprints(current, imported, options = {}) {
  const includeVolatile = Boolean(options.includeVolatile);
  const rows = [];
  walk('$', normalizeForJson(current), normalizeForJson(imported), rows);
  const filtered = rows.map((row) => ({ ...row, excluded: !includeVolatile && isVolatilePath(row.path) }));
  const comparable = filtered.filter((r) => !r.excluded && ['identical', 'changed'].includes(r.result));
  const summary = {
    totalFields: filtered.filter((r) => !r.excluded).length,
    identical: filtered.filter((r) => !r.excluded && r.result === 'identical').length,
    changed: filtered.filter((r) => !r.excluded && r.result === 'changed').length,
    currentOnly: filtered.filter((r) => !r.excluded && r.result === 'only in current').length,
    importedOnly: filtered.filter((r) => !r.excluded && r.result === 'only in imported').length,
    incomparable: filtered.filter((r) => !r.excluded && r.result === 'incomparable').length,
    errors: filtered.filter((r) => !r.excluded && r.result === 'error').length,
    comparableFields: comparable.length,
    similarityPercentage: comparable.length ? Number(((comparable.filter((r) => r.result === 'identical').length / comparable.length) * 100).toFixed(2)) : 0,
    similarityFormula: 'identical comparable fields / total comparable fields; volatile metadata excluded by default; not entropy or uniqueness.',
  };
  return { comparisonTimestampUTC: new Date().toISOString(), summary, excludedVolatilePaths: VOLATILE_PATH_PATTERNS.map(String), rows: filtered };
}

function walk(path, a, b, rows) {
  try {
    const aMissing = a === MISSING; const bMissing = b === MISSING;
    if (aMissing || bMissing) { rows.push(row(path, a, b, aMissing ? 'only in imported' : 'only in current')); return; }
    if (isLeaf(a) && isLeaf(b)) { rows.push(row(path, a, b, Object.is(a, b) ? 'identical' : 'changed')); return; }
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!Array.isArray(a) || !Array.isArray(b)) { rows.push(row(path, a, b, 'incomparable')); return; }
      for (let i = 0; i < Math.max(a.length, b.length); i += 1) walk(`${path}[${i}]`, i in a ? a[i] : MISSING, i in b ? b[i] : MISSING, rows);
      return;
    }
    if (typeof a === 'object' && typeof b === 'object' && a && b) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)].sort())) walk(`${path}.${escapePath(key)}`, key in a ? a[key] : MISSING, key in b ? b[key] : MISSING, rows);
      return;
    }
    rows.push(row(path, a, b, 'incomparable'));
  } catch (error) { rows.push(row(path, a, b, 'error', error.message)); }
}
const MISSING = Symbol('missing');
const isLeaf = (v) => v === null || typeof v !== 'object';
const escapePath = (key) => /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
function row(path, currentValue, importedValue, result, error = null) { return { path, currentValue: currentValue === MISSING ? undefined : currentValue, importedValue: importedValue === MISSING ? undefined : importedValue, result, error }; }
export function isVolatilePath(path) { return VOLATILE_PATH_PATTERNS.some((pattern) => pattern.test(path)); }
export function createComparisonReport(comparison, sourceFilenames = {}) { return normalizeForJson({ ...comparison, sourceFilenames: { current: basename(sourceFilenames.current), imported: basename(sourceFilenames.imported) }, rows: comparison.rows.filter((r) => !r.excluded && r.result !== 'identical') }); }
function basename(name) { return name ? String(name).split(/[\\/]/).pop() : null; }
export function formatValue(value) { const text = value === undefined ? '—' : stableStringify(value); return text.length > 180 ? `${text.slice(0, 180)}…` : text; }
