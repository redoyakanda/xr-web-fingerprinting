import { safeRead } from './utils.js';

/**
 * Collects passive Screen API properties.
 *
 * @returns {Object} Serializable screen fingerprint data.
 */
export function collectScreenFingerprint() {
  const currentScreen = window.screen;

  return {
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
  };
}
