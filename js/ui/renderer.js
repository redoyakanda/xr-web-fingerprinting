import { stringifyFingerprint } from '../export/jsonExport.js';

export function renderFingerprint(fingerprint, elements) {
  elements.jsonViewer.textContent = stringifyFingerprint(fingerprint);
  elements.jsonTimestamp.textContent = fingerprint.metadata.collectedAt;
  elements.resultsSummary.textContent = `Collected ${fingerprint.metadata.modules.length} modules: ${fingerprint.metadata.modules.join(', ')}.`;
  elements.statusMessage.textContent = 'Fingerprint collected successfully.';
  elements.copyButton.disabled = false;
  elements.downloadButton.disabled = false;
}

export function renderStatus(message, elements) {
  elements.statusMessage.textContent = message;
}
