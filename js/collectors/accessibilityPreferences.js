import { createCollectorResult } from '../utils/utils.js';

const MEDIA_FEATURES = {
  'prefers-reduced-motion': ['reduce', 'no-preference'],
  'prefers-reduced-transparency': ['reduce', 'no-preference'],
  'prefers-contrast': ['more', 'less', 'custom', 'no-preference'],
  'forced-colors': ['active', 'none'],
  'inverted-colors': ['inverted', 'none'],
  'prefers-color-scheme': ['dark', 'light', 'no-preference'],
  'prefers-reduced-data': ['reduce', 'no-preference'],
  'color-gamut': ['rec2020', 'p3', 'srgb'],
  'dynamic-range': ['high', 'standard'],
  'video-dynamic-range': ['high', 'standard'],
  pointer: ['fine', 'coarse', 'none'],
  'any-pointer': ['fine', 'coarse', 'none'],
  hover: ['hover', 'none'],
  'any-hover': ['hover', 'none'],
  orientation: ['portrait', 'landscape'],
  'display-mode': ['fullscreen', 'standalone', 'minimal-ui', 'window-controls-overlay', 'browser'],
};

/**
 * Takes one passive snapshot. Accessibility preferences are browser-exposed
 * state and do not imply screen-reader use or disability status.
 */
export function collectAccessibilityPreferencesFingerprint() {
  const warnings = ['Accessibility-related preferences do not imply screen-reader use or disability status.'];
  const errors = [];
  const matchMedia = globalThis.window?.matchMedia;
  const preferences = {};

  for (const [feature, candidates] of Object.entries(MEDIA_FEATURES)) {
    preferences[feature] = inspectMediaFeature(feature, candidates, matchMedia, errors);
  }

  const viewport = globalThis.window?.visualViewport;
  const visualViewport = {
    property: 'window.visualViewport',
    supported: viewport != null,
    observedValue: viewport ? {
      width: finiteOrNull(viewport.width), height: finiteOrNull(viewport.height),
      offsetLeft: finiteOrNull(viewport.offsetLeft), offsetTop: finiteOrNull(viewport.offsetTop),
      pageLeft: finiteOrNull(viewport.pageLeft), pageTop: finiteOrNull(viewport.pageTop),
      scale: finiteOrNull(viewport.scale),
    } : null,
  };
  const devicePixelRatio = {
    property: 'window.devicePixelRatio',
    supported: typeof globalThis.window?.devicePixelRatio === 'number',
    observedValue: finiteOrNull(globalThis.window?.devicePixelRatio),
  };

  if (typeof matchMedia !== 'function') warnings.push('window.matchMedia is unavailable; media preferences could not be evaluated.');
  return createCollectorResult('accessibilityPreferences', typeof matchMedia === 'function' || visualViewport.supported || devicePixelRatio.supported, {
    interpretationNotice: 'Accessibility preferences do not imply screen-reader use.',
    preferences,
    devicePixelRatio,
    visualViewport,
  }, warnings, errors);
}

function inspectMediaFeature(feature, candidates, matchMedia, errors) {
  const query = candidates.map((value) => `(${feature}: ${value})`).join(', ');
  if (typeof matchMedia !== 'function') return { query, supported: false, observedValue: null };
  try {
    const observations = candidates.map((value) => ({ value, matches: Boolean(matchMedia.call(globalThis.window, `(${feature}: ${value})`).matches) }));
    const matched = observations.filter(({ matches }) => matches).map(({ value }) => value);
    return { query, supported: true, observedValue: matched.length ? matched : null, observations };
  } catch (error) {
    errors.push(`${feature}: ${error instanceof Error ? error.message : String(error)}`);
    return { query, supported: false, observedValue: null };
  }
}

function finiteOrNull(value) { return Number.isFinite(value) ? value : null; }
