export function normalizeForJson(value, options = {}, seen = new WeakMap()) {
  const { includeErrorStacks = false } = options;
  if (value === undefined) return { __type: 'undefined', value: null };
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return { __type: 'number', value: 'NaN' };
    if (value === Infinity) return { __type: 'number', value: 'Infinity' };
    if (value === -Infinity) return { __type: 'number', value: '-Infinity' };
    return value;
  }
  if (typeof value === 'bigint') return { __type: 'bigint', value: value.toString() };
  if (typeof value === 'function') return { __type: 'function', name: value.name || null };
  if (typeof value === 'symbol') return { __type: 'symbol', value: String(value) };
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return { __type: 'circular', path: seen.get(value) };
  seen.set(value, '$');

  if (value instanceof Error) {
    const out = { name: value.name, message: value.message };
    if (includeErrorStacks && value.stack) out.stack = value.stack;
    return out;
  }
  if (ArrayBuffer.isView(value)) return { __type: value.constructor?.name || 'TypedArray', values: Array.from(value) };
  if (value instanceof ArrayBuffer) return { __type: 'ArrayBuffer', bytes: Array.from(new Uint8Array(value)) };
  if (value instanceof Map) return Object.fromEntries(Array.from(value.entries()).map(([k, v]) => [String(k), normalizeForJson(v, options, seen)]).sort(([a], [b]) => a.localeCompare(b)));
  if (value instanceof Set) return Array.from(value.values()).map((v) => normalizeForJson(v, options, seen)).sort(compareStable);
  if (typeof PermissionStatus !== 'undefined' && value instanceof PermissionStatus) return { state: value.state, name: value.name ?? null };
  if (Array.isArray(value)) return value.map((item) => normalizeForJson(item, options, seen));

  const out = {};
  for (const key of Object.keys(value).sort()) out[key] = normalizeForJson(value[key], options, seen);
  return out;
}

function compareStable(a, b) { return stableStringify(a).localeCompare(stableStringify(b)); }
export function stableStringify(value, options = {}) { return JSON.stringify(normalizeForJson(value, options)); }
export function countLeafValues(value) {
  if (value === null || typeof value !== 'object') return 1;
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countLeafValues(item), 0);
  return Object.keys(value).reduce((sum, key) => sum + countLeafValues(value[key]), 0);
}
