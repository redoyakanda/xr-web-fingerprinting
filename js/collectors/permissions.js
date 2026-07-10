import { createCollectorResult, safeRead } from '../utils/utils.js';

const PERMISSIONS = [
  ['geolocation', 'geolocation'],
  ['notifications', 'notifications'],
  ['camera', 'camera'],
  ['microphone', 'microphone'],
  ['clipboard-read', 'clipboardRead'],
  ['clipboard-write', 'clipboardWrite'],
  ['persistent-storage', 'persistentStorage'],
  ['midi', 'midi'],
  ['background-sync', 'backgroundSync'],
  ['accelerometer', 'accelerometer'],
  ['gyroscope', 'gyroscope'],
  ['magnetometer', 'magnetometer'],
];

const EMPTY_PERMISSION = Object.freeze({ supported: false, state: null, error: null });

/**
 * Passively reads Permissions API state values. The combination of supported
 * descriptors and their states can contribute to browser fingerprinting even
 * when the protected resources are never accessed, so this collector only calls
 * navigator.permissions.query() and never invokes APIs that request permission.
 */
export async function collectPermissionsFingerprint() {
  const warnings = [];
  const errors = [];
  const nav = globalThis.navigator;
  const permissions = safeRead(() => nav?.permissions);
  const permissionsAPIAvailable = Boolean(permissions && !permissions.unavailable && typeof permissions.query === 'function');
  const queriedPermissions = Object.fromEntries(PERMISSIONS.map(([, key]) => [key, { ...EMPTY_PERMISSION }]));
  let successfulQueries = 0;
  let failedQueries = 0;

  const values = {
    secureContext: safeRead(() => globalThis.window?.isSecureContext ?? globalThis.isSecureContext),
    permissionsAPIAvailable,
    queriedPermissions,
    successfulQueries,
    failedQueries,
  };

  if (!permissionsAPIAvailable) {
    warnings.push('Permissions API is unavailable; permission states could not be queried passively.');
    values.failedQueries = PERMISSIONS.length;
    return createCollectorResult('permissions', false, values, warnings, errors);
  }

  await Promise.all(PERMISSIONS.map(async ([name, key]) => {
    try {
      const status = await permissions.query({ name });
      const state = ['granted', 'denied', 'prompt'].includes(status?.state) ? status.state : null;

      queriedPermissions[key] = {
        supported: true,
        state,
        error: null,
      };
      successfulQueries += 1;

      if (state === null) {
        warnings.push(`Permission descriptor "${name}" returned an unrecognized state.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      queriedPermissions[key] = {
        supported: false,
        state: null,
        error: message,
      };
      failedQueries += 1;
      warnings.push(`Permission descriptor "${name}" could not be queried: ${message}`);
    }
  }));

  values.successfulQueries = successfulQueries;
  values.failedQueries = failedQueries;

  return createCollectorResult('permissions', successfulQueries > 0, values, warnings, errors);
}
