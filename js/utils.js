/**
 * Shared utility helpers for fingerprint collection modules.
 * Keep this file generic so future modules can reuse the same conventions.
 */

/**
 * Safely evaluates a property getter and normalizes thrown errors.
 *
 * @param {Function} getter - Function that returns a browser-exposed value.
 * @returns {*} The collected value or an error description object.
 */
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

/**
 * Converts array-like browser objects into plain arrays.
 *
 * @param {ArrayLike|Iterable|null|undefined} value - Browser collection value.
 * @returns {Array} A serializable array.
 */
export function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.from(value);
}

/**
 * Returns an ISO-8601 timestamp for collection metadata.
 *
 * @returns {string} Current timestamp.
 */
export function createTimestamp() {
  return new Date().toISOString();
}
