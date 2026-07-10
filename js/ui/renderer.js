import { stringifyFingerprint } from '../export/jsonExport.js';

export function renderFingerprint(fingerprint, elements) {
  elements.jsonViewer.textContent = stringifyFingerprint(fingerprint);
  elements.jsonTimestamp.textContent = fingerprint.metadata.collectedAt;
  elements.resultsSummary.textContent = `Collected ${fingerprint.metadata.modules.length} modules: ${fingerprint.metadata.modules.join(', ')}.`;
  const webxrStatus = fingerprint.webxr
    ? ` WebXR collection complete. WebXR supported: ${fingerprint.webxr.supported ? 'yes' : 'no'}.`
    : '';
  elements.statusMessage.textContent = `Fingerprint collected successfully.${webxrStatus}`;
  elements.copyButton.disabled = false;
  elements.downloadButton.disabled = false;
}

export function renderStatus(message, elements) {
  elements.statusMessage.textContent = message;
}
