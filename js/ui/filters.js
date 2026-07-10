import { stableStringify } from '../utils/normalization.js';

export const FILTERS = ['all', 'supported', 'unsupported', 'warnings', 'errors', 'xr', 'graphics', 'privacy', 'changed'];
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
function walk(path, value, category, collector, rows) {
  if (value === null || typeof value !== 'object') { rows.push({ category, path, value, collector, kind: 'value' }); return; }
  if (Array.isArray(value)) { value.forEach((item, i) => walk(`${path}[${i}]`, item, category, collector, rows)); return; }
  for (const key of Object.keys(value).sort()) walk(`${path}.${key}`, value[key], category, collector, rows);
}

export function filterRows(rows, { search = '', filter = 'all', changedPaths = new Set() } = {}) {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => matchesFilter(row, filter, changedPaths) && (!q || `${row.category} ${row.path} ${stableStringify(row.value)}`.toLowerCase().includes(q)));
}
function matchesFilter(row, filter, changedPaths) {
  if (filter === 'all') return true;
  if (filter === 'supported') return row.collector.supported;
  if (filter === 'unsupported') return !row.collector.supported;
  if (filter === 'warnings') return row.collector.warnings?.length > 0;
  if (filter === 'errors') return row.collector.errors?.length > 0;
  if (filter === 'changed') return changedPaths.has(row.path) || changedPaths.has(row.path.replace('.values', ''));
  return TAGS[filter]?.includes(row.category) || false;
}
