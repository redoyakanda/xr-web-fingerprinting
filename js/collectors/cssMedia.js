import { createCollectorResult } from '../utils/utils.js';

const MEDIA_QUERIES = [
  ['prefersColorSchemeDark', '(prefers-color-scheme: dark)'], ['prefersColorSchemeLight', '(prefers-color-scheme: light)'],
  ['prefersContrastMore', '(prefers-contrast: more)'], ['prefersContrastLess', '(prefers-contrast: less)'],
  ['prefersReducedTransparency', '(prefers-reduced-transparency: reduce)'], ['forcedColorsActive', '(forced-colors: active)'],
  ['invertedColorsInverted', '(inverted-colors: inverted)'], ['colorGamutSrgb', '(color-gamut: srgb)'],
  ['colorGamutP3', '(color-gamut: p3)'], ['colorGamutRec2020', '(color-gamut: rec2020)'],
  ['dynamicRangeHigh', '(dynamic-range: high)'], ['videoDynamicRangeHigh', '(video-dynamic-range: high)'],
  ['prefersReducedMotion', '(prefers-reduced-motion: reduce)'], ['prefersReducedData', '(prefers-reduced-data: reduce)'],
  ['hoverHover', '(hover: hover)'], ['hoverNone', '(hover: none)'], ['anyHoverHover', '(any-hover: hover)'], ['anyHoverNone', '(any-hover: none)'],
  ['pointerFine', '(pointer: fine)'], ['pointerCoarse', '(pointer: coarse)'], ['pointerNone', '(pointer: none)'],
  ['anyPointerFine', '(any-pointer: fine)'], ['anyPointerCoarse', '(any-pointer: coarse)'], ['anyPointerNone', '(any-pointer: none)'],
  ['orientationPortrait', '(orientation: portrait)'], ['orientationLandscape', '(orientation: landscape)'],
  ['displayModeBrowser', '(display-mode: browser)'], ['displayModeFullscreen', '(display-mode: fullscreen)'],
  ['displayModeStandalone', '(display-mode: standalone)'], ['displayModeMinimalUi', '(display-mode: minimal-ui)'],
  ['displayModeWindowControlsOverlay', '(display-mode: window-controls-overlay)'], ['scriptingEnabled', '(scripting: enabled)'],
  ['updateFast', '(update: fast)'], ['updateSlow', '(update: slow)'], ['updateNone', '(update: none)'],
];

/** Media-query combinations can reveal display, accessibility preference, and input-device characteristics without listeners. */
export function collectCssMediaFingerprint() {
  const warnings = [];
  const errors = [];
  const matchMediaAvailable = typeof globalThis.window?.matchMedia === 'function';
  const queries = {};
  let matchedCount = 0;
  let failedCount = 0;
  let listenerSupport = { addEventListener: false, addListener: false };

  if (!matchMediaAvailable) warnings.push('window.matchMedia is unavailable; CSS media query results cannot be collected.');

  for (const [key, query] of MEDIA_QUERIES) {
    if (!matchMediaAvailable) {
      queries[key] = { query, matches: false, error: 'matchMedia unavailable' };
      continue;
    }
    try {
      const mql = globalThis.window.matchMedia(query);
      if (key === MEDIA_QUERIES[0][0]) {
        listenerSupport = { addEventListener: typeof mql.addEventListener === 'function', addListener: typeof mql.addListener === 'function' };
      }
      const matches = Boolean(mql.matches);
      if (matches) matchedCount += 1;
      queries[key] = { query, matches };
    } catch (error) {
      failedCount += 1;
      const message = error instanceof Error ? error.message : String(error);
      queries[key] = { query, matches: false, error: message };
      errors.push(`${query}: ${message}`);
    }
  }

  return createCollectorResult('cssMedia', matchMediaAvailable, {
    matchMediaAvailable,
    queryCount: MEDIA_QUERIES.length,
    matchedCount,
    unmatchedCount: MEDIA_QUERIES.length - matchedCount - failedCount,
    failedCount,
    listenerSupport,
    queries,
  }, warnings, errors);
}
