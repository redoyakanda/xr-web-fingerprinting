import { createCollectorResult, safeRead } from '../utils/utils.js';

/**
 * Collects passive Screen API properties.
 *
 * @returns {Object} Serializable screen fingerprint result.
 */
export function collectScreenFingerprint() {
  const warnings = [];
  const errors = [];

  try {
    const currentScreen = window.screen;

    if (!currentScreen) {
      return createCollectorResult('screen', false, {}, ['Screen API is unavailable.'], errors);
    }

    return createCollectorResult('screen', true, {
      width: safeRead(() => currentScreen.width),
      height: safeRead(() => currentScreen.height),
      availableWidth: safeRead(() => currentScreen.availWidth),
      availableHeight: safeRead(() => currentScreen.availHeight),
      colorDepth: safeRead(() => currentScreen.colorDepth),
      pixelDepth: safeRead(() => currentScreen.pixelDepth),
      orientation: {
        type: safeRead(() => currentScreen.orientation?.type),
        angle: safeRead(() => currentScreen.orientation?.angle),
      },
    }, warnings, errors);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return createCollectorResult('screen', false, {}, warnings, errors);
  }
}
