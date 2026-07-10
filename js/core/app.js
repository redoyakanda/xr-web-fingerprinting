import { collectCanvasFingerprint } from '../collectors/canvas.js';
import { collectNavigatorFingerprint } from '../collectors/navigator.js';
import { collectScreenFingerprint } from '../collectors/screen.js';
import { collectWebGLFingerprint } from '../collectors/webgl.js';
import { collectWindowFingerprint } from '../collectors/window.js';
import { copyFingerprintJson, downloadFingerprintJson } from '../export/jsonExport.js';
import { renderFingerprint, renderStatus } from '../ui/renderer.js';
import { createTimestamp } from '../utils/utils.js';

const elements = {
  collectButton: document.querySelector('#collect-button'),
  copyButton: document.querySelector('#copy-button'),
  downloadButton: document.querySelector('#download-button'),
  statusMessage: document.querySelector('#status-message'),
  resultsSummary: document.querySelector('#results-summary'),
  jsonViewer: document.querySelector('#json-viewer'),
  jsonTimestamp: document.querySelector('#json-timestamp'),
};

let latestFingerprint = null;
const modules = ['navigator', 'screen', 'window', 'canvas', 'webgl'];

/** Runs all enabled collector modules and merges their standard JSON envelopes. */
async function collectFingerprint() {
  const collectedAt = createTimestamp();

  return {
    metadata: {
      project: 'XR Web Fingerprinting Research Platform',
      collectedAt,
      moduleVersion: 'task-2-canvas-webgl',
      modules,
    },
    navigator: collectNavigatorFingerprint(),
    screen: collectScreenFingerprint(),
    window: collectWindowFingerprint(),
    canvas: await collectCanvasFingerprint(),
    webgl: collectWebGLFingerprint(),
  };
}

elements.collectButton.addEventListener('click', async () => {
  renderStatus('Collecting fingerprint...', elements);
  latestFingerprint = await collectFingerprint();
  renderFingerprint(latestFingerprint, elements);
});

elements.downloadButton.addEventListener('click', () => {
  if (latestFingerprint) {
    downloadFingerprintJson(latestFingerprint);
  }
});

elements.copyButton.addEventListener('click', async () => {
  if (latestFingerprint) {
    await copyFingerprintJson(latestFingerprint);
    renderStatus('Fingerprint JSON copied to clipboard.', elements);
  }
});
