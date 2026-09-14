import { stableStringify } from '../utils/normalization.js';

export const FILTERS = ['all', 'supported', 'unsupported', 'warnings', 'errors', 'xr', 'graphics', 'privacy', 'changed'];
export const DEFAULT_RESULT_FILTERS = Object.freeze({
  searchQuery: '', categoryFilter: 'all', featureFamily: 'all',
  showOnlyChanged: false, showOnlyWarnings: false, showOnlyErrors: false,
  showOnlySupported: false, showOnlyUnsupported: false,
});
const TAGS = {
  xr: ['webxr', 'gamepad'],
  graphics: ['canvas', 'webgl', 'webgpu'],
  privacy: ['permissions', 'storage', 'network', 'fonts', 'featureDetection', 'cssMedia'],
};

export function flattenFingerprint(fingerprint) {
  const rows = [];
  for (const [name, collector] of Object.entries(fingerprint?.collectors || {})) {
    rows.push({ category: name, path: `$.collectors.${name}`, value: collector.supported ? 'supported' : 'unsupported', collector, kind: 'collector' });
    walk(`$.collectors.${name}.values`, collector.values, name, collector, rows);
  }
  return rows;
}

/** Flatten any JSON-compatible result without assuming the collector schema. */
export function flattenResult(value, { rootPath = '$', category = 'Result' } = {}) {
  const rows = [];
  walkResult(rootPath, value, category, rows);
  return rows;
}
function walkResult(path, value, category, rows) {
  if (value === null || typeof value !== 'object') { rows.push({ category, path, value, kind: 'value' }); return; }
  if (Array.isArray(value)) {
    if (value.length === 0) rows.push({ category, path, value, kind: 'value' });
    else value.forEach((item, index) => walkResult(`${path}[${index}]`, item, category, rows));
    return;
  }
  const keys = Object.keys(value);
  if (keys.length === 0) { rows.push({ category, path, value, kind: 'value' }); return; }
  for (const key of keys) walkResult(`${path}.${key}`, value[key], category, rows);
}
export function searchResultRows(rows, search = '') {
  const query = String(search).trim().toLowerCase();
  if (query.length === 0) return [...rows];
  return rows.filter((row) => `${row.path} ${row.path.split(/[.[\]]/).filter(Boolean).at(-1) || ''} ${stableStringify(row.value)}`.toLowerCase().includes(query));
}
export function isResultFilterActive({ search = '', filter = 'all' } = {}) {
  return String(search).trim().length > 0 || filter !== 'all';
}
function walk(path, value, category, collector, rows) {
  if (value === null || typeof value !== 'object') { rows.push({ category, path, value, collector, kind: 'value' }); return; }
  if (Array.isArray(value)) {
    if (value.length === 0) rows.push({ category, path, value, collector, kind: 'value' });
    else value.forEach((item, i) => walk(`${path}[${i}]`, item, category, collector, rows));
    return;
  }
  const keys = Object.keys(value).sort();
  if (keys.length === 0) rows.push({ category, path, value, collector, kind: 'value' });
  else for (const key of keys) walk(`${path}.${key}`, value[key], category, collector, rows);
}

export function filterRows(rows, { search = '', filter = 'all', changedPaths = new Set() } = {}) {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => matchesFilter(row, filter, changedPaths) && (!q || `${row.category} ${row.path} ${stableStringify(row.value)}`.toLowerCase().includes(q)));
}
function matchesFilter(row, filter, changedPaths) {
  if (filter === 'all') return true;
  // Collector-only filters never classify or discard arbitrary result rows.
  if (!row.collector) return true;
  if (filter === 'supported') return row.collector.supported;
  if (filter === 'unsupported') return !row.collector.supported;
  if (filter === 'warnings') return row.collector.warnings?.length > 0;
  if (filter === 'errors') return row.collector.errors?.length > 0;
  if (filter === 'changed') return changedPaths.has(row.path) || changedPaths.has(row.path.replace('.values', ''));
  return TAGS[filter]?.includes(row.category) || false;
}
