import { collectNavigatorFingerprint } from './js/navigator.js';
import { collectScreenFingerprint } from './js/screen.js';
import { collectWindowFingerprint } from './js/window.js';
import { createTimestamp } from './js/utils.js';

const collectButton = document.querySelector('#collect-button');
const copyButton = document.querySelector('#copy-button');
const downloadButton = document.querySelector('#download-button');
const statusMessage = document.querySelector('#status-message');
const resultsSummary = document.querySelector('#results-summary');
const jsonViewer = document.querySelector('#json-viewer');
const jsonTimestamp = document.querySelector('#json-timestamp');

let latestFingerprint = null;

/**
 * Runs all currently enabled collector modules and merges their output.
 * Future modules should be added here as new top-level keys.
 *
 * @returns {Object} Complete serializable fingerprint object.
 */
function collectFingerprint() {
  const collectedAt = createTimestamp();

  return {
    metadata: {
      project: 'XR Web Fingerprinting Research Platform',
      collectedAt,
      moduleVersion: 'foundation',
      modules: ['navigator', 'screen', 'window'],
    },
    navigator: collectNavigatorFingerprint(),
    screen: collectScreenFingerprint(),
    window: collectWindowFingerprint(),
  };
}

/**
 * Renders the latest fingerprint and updates UI affordances.
 *
 * @param {Object} fingerprint - Complete fingerprint object.
 */
function renderFingerprint(fingerprint) {
  const formattedJson = JSON.stringify(fingerprint, null, 2);
  jsonViewer.textContent = formattedJson;
  jsonTimestamp.textContent = fingerprint.metadata.collectedAt;
  resultsSummary.textContent = `Collected ${fingerprint.metadata.modules.length} modules: ${fingerprint.metadata.modules.join(', ')}.`;
  statusMessage.textContent = 'Fingerprint collected successfully.';
  copyButton.disabled = false;
  downloadButton.disabled = false;
}

/**
 * Downloads the current fingerprint as a JSON file.
 */
function downloadJson() {
  if (!latestFingerprint) {
    return;
  }

  const json = JSON.stringify(latestFingerprint, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const timestamp = latestFingerprint.metadata.collectedAt.replace(/[:.]/g, '-');

  anchor.href = url;
  anchor.download = `xr-web-fingerprint-${timestamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Copies the current fingerprint JSON to the clipboard.
 */
async function copyJson() {
  if (!latestFingerprint) {
    return;
  }

  await navigator.clipboard.writeText(JSON.stringify(latestFingerprint, null, 2));
  statusMessage.textContent = 'Fingerprint JSON copied to clipboard.';
}

collectButton.addEventListener('click', () => {
  statusMessage.textContent = 'Collecting fingerprint...';
  latestFingerprint = collectFingerprint();
  renderFingerprint(latestFingerprint);
});

downloadButton.addEventListener('click', downloadJson);
copyButton.addEventListener('click', copyJson);
