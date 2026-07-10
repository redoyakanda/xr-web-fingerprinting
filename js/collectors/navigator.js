import { createCollectorResult, safeRead, toArray } from '../utils/utils.js';

/**
 * Collects passive Navigator API properties exposed by the browser.
 * This module intentionally avoids permission prompts and active probes.
 *
 * @returns {Object} Serializable navigator fingerprint result.
 */
export function collectNavigatorFingerprint() {
  const warnings = [];
  const errors = [];
  const nav = window.navigator;

  if (!nav) {
    return createCollectorResult('navigator', false, {}, ['Navigator API is unavailable.'], errors);
  }

  const values = {
    userAgent: safeRead(() => nav.userAgent),
    appCodeName: safeRead(() => nav.appCodeName),
    appName: safeRead(() => nav.appName),
    appVersion: safeRead(() => nav.appVersion),
    platform: safeRead(() => nav.platform),
    product: safeRead(() => nav.product),
    productSub: safeRead(() => nav.productSub),
    vendor: safeRead(() => nav.vendor),
    vendorSub: safeRead(() => nav.vendorSub),
    language: safeRead(() => nav.language),
    languages: safeRead(() => toArray(nav.languages)),
    cookieEnabled: safeRead(() => nav.cookieEnabled),
    doNotTrack: safeRead(() => nav.doNotTrack),
    hardwareConcurrency: safeRead(() => nav.hardwareConcurrency),
    maxTouchPoints: safeRead(() => nav.maxTouchPoints),
    pdfViewerEnabled: safeRead(() => nav.pdfViewerEnabled),
    webdriver: safeRead(() => nav.webdriver),
  };

  return createCollectorResult('navigator', true, values, warnings, errors);
}
