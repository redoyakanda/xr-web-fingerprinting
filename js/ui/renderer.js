import { stringifyFingerprint } from '../export/jsonExport.js';

export function renderFingerprint(fingerprint, elements) {
  elements.jsonViewer.textContent = stringifyFingerprint(fingerprint);
  elements.jsonTimestamp.textContent = fingerprint.metadata.collectedAt;
  elements.resultsSummary.textContent = `Collected ${fingerprint.metadata.modules.length} modules: ${fingerprint.metadata.modules.join(', ')}.`;
  const warningCount = Object.values(fingerprint)
    .filter((value) => value && Array.isArray(value.warnings))
    .reduce((count, value) => count + value.warnings.length, 0);
  const webxrStatus = fingerprint.webxr
    ? ` WebXR collection complete. WebXR supported: ${fingerprint.webxr.supported ? 'yes' : 'no'}.`
    : '';
  const warningStatus = warningCount > 0 ? ` Non-fatal warnings: ${warningCount}; see module warnings in the JSON.` : '';
  elements.statusMessage.textContent = `Fingerprint collected successfully.${webxrStatus}${warningStatus}`;
  elements.copyButton.disabled = false;
  elements.downloadButton.disabled = false;
}

export function renderStatus(message, elements) {
  elements.statusMessage.textContent = message;
}
