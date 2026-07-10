import { createCollectorResult } from '../utils/utils.js';

export const FONT_TEST_STRING = 'mmmmmmmmmmlli XR Web Fingerprinting 0123456789';

export const FONT_GROUPS = {
  platformCommon: [
    'Arial', 'Arial Black', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Times New Roman', 'Georgia', 'Garamond',
    'Courier New', 'Brush Script MT', 'Comic Sans MS', 'Impact', 'Segoe UI', 'Roboto', 'Noto Sans', 'Helvetica',
    'Helvetica Neue', 'San Francisco', 'Ubuntu', 'Cantarell', 'DejaVu Sans', 'Liberation Sans', 'Droid Sans',
  ],
  xrVendorCandidates: ['Oculus Sans'],
  genericCssFamilies: ['system-ui', 'sans-serif', 'serif', 'monospace'],
};

export const PREDEFINED_FONTS = Object.freeze([
  ...FONT_GROUPS.platformCommon,
  ...FONT_GROUPS.xrVendorCandidates,
  ...FONT_GROUPS.genericCssFamilies,
]);

/**
 * Tests only a documented, predefined list of font families. Font availability
 * can reveal platform, browser, installed software, or XR device-family clues,
 * so this collector never calls queryLocalFonts() or enumerates arbitrary local
 * files. Width fallback is coarse and may produce false positives.
 */
export function collectFontsFingerprint() {
  const warnings = [];
  const errors = [];
  const fontLoadingAPIAvailable = Boolean(globalThis.document?.fonts && typeof globalThis.document.fonts.check === 'function');
  const domFallbackAvailable = Boolean(globalThis.document?.body && typeof globalThis.document.createElement === 'function');
  const method = fontLoadingAPIAvailable ? 'font-loading-api' : (domFallbackAvailable ? 'width-measurement' : 'unsupported');

  if (!fontLoadingAPIAvailable) {
    warnings.push('CSS Font Loading API unavailable; controlled width-measurement fallback may produce false positives.');
  }
  if (method === 'unsupported') {
    warnings.push('No supported passive font detection method is available in this environment.');
  }

  const fonts = {};
  for (const family of PREDEFINED_FONTS) {
    try {
      fonts[family] = fontLoadingAPIAvailable
        ? checkWithFontLoadingAPI(family)
        : (domFallbackAvailable ? checkWithWidthMeasurement(family) : unsupportedFontResult());
    } catch (error) {
      fonts[family] = { available: null, method, warning: error instanceof Error ? error.message : String(error) };
      errors.push(`${family}: ${fonts[family].warning}`);
    }
  }

  const availableFontCount = Object.values(fonts).filter((font) => font.available === true).length;

  return createCollectorResult('fonts', method !== 'unsupported', {
    fontLoadingAPIAvailable,
    method,
    testString: FONT_TEST_STRING,
    testedFontCount: PREDEFINED_FONTS.length,
    availableFontCount,
    fallbackRequired: !fontLoadingAPIAvailable,
    fontGroups: FONT_GROUPS,
    fonts,
  }, warnings, errors);
}

function checkWithFontLoadingAPI(family) {
  const cssFamily = quoteFontFamily(family);
  return {
    available: Boolean(globalThis.document.fonts.check(`16px ${cssFamily}`, FONT_TEST_STRING)),
    method: 'font-loading-api',
    warning: null,
  };
}

function checkWithWidthMeasurement(family) {
  const baselines = ['monospace', 'serif', 'sans-serif'];
  const baselineWidths = Object.fromEntries(baselines.map((generic) => [generic, measureWidth(generic)]));
  const available = baselines.some((generic) => measureWidth(`${quoteFontFamily(family)}, ${generic}`) !== baselineWidths[generic]);
  return { available, method: 'width-measurement', warning: 'Width fallback is heuristic and may produce false positives.' };
}

function measureWidth(fontFamily) {
  const node = globalThis.document.createElement('span');
  node.textContent = FONT_TEST_STRING;
  node.style.cssText = `position:absolute;left:-9999px;top:-9999px;font-size:72px;font-family:${fontFamily};white-space:nowrap;`;
  globalThis.document.body.appendChild(node);
  const width = node.offsetWidth;
  node.remove();
  return width;
}

function unsupportedFontResult() {
  return { available: null, method: 'unsupported', warning: 'Font detection unsupported without document.fonts.check() or DOM measurement.' };
}

function quoteFontFamily(family) {
  return /^[a-z-]+$/i.test(family) ? family : `"${family.replaceAll('"', '\\"')}"`;
}
