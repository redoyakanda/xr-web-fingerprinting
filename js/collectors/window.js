import { createCollectorResult, safeRead } from '../utils/utils.js';

/**
 * Collects passive Window properties that describe the browser viewport.
 *
 * @returns {Object} Serializable window fingerprint result.
 */
export function collectWindowFingerprint() {
  const warnings = [];
  const errors = [];

  try {
    return createCollectorResult('window', typeof window !== 'undefined', {
      innerWidth: safeRead(() => window.innerWidth),
      innerHeight: safeRead(() => window.innerHeight),
      outerWidth: safeRead(() => window.outerWidth),
      outerHeight: safeRead(() => window.outerHeight),
      devicePixelRatio: safeRead(() => window.devicePixelRatio),
      screenX: safeRead(() => window.screenX),
      screenY: safeRead(() => window.screenY),
      pageXOffset: safeRead(() => window.pageXOffset),
      pageYOffset: safeRead(() => window.pageYOffset),
      visualViewport: {
        width: safeRead(() => window.visualViewport?.width),
        height: safeRead(() => window.visualViewport?.height),
        scale: safeRead(() => window.visualViewport?.scale),
        offsetLeft: safeRead(() => window.visualViewport?.offsetLeft),
        offsetTop: safeRead(() => window.visualViewport?.offsetTop),
      },
    }, warnings, errors);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return createCollectorResult('window', false, {}, warnings, errors);
  }
}
