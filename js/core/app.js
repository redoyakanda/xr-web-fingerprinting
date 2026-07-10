import { collectAudioFingerprint } from '../collectors/audio.js';
import { collectCanvasFingerprint } from '../collectors/canvas.js';
import { collectNavigatorFingerprint } from '../collectors/navigator.js';
import { collectScreenFingerprint } from '../collectors/screen.js';
import { collectWebGLFingerprint } from '../collectors/webgl.js';
import { collectWebGPUFingerprint } from '../collectors/webgpu.js';
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
const collectors = [
  ['navigator', collectNavigatorFingerprint],
  ['screen', collectScreenFingerprint],
  ['window', collectWindowFingerprint],
  ['canvas', collectCanvasFingerprint],
  ['webgl', collectWebGLFingerprint],
  ['audio', collectAudioFingerprint],
  ['webgpu', collectWebGPUFingerprint],
];

const modules = collectors.map(([name]) => name);

/** Runs all enabled collector modules and merges their standard JSON envelopes. */
async function collectFingerprint() {
  const collectedAt = createTimestamp();

  const results = await Promise.all(
    collectors.map(async ([name, collector]) => [name, await runCollector(name, collector)]),
  );

  return {
    metadata: {
      project: 'XR Web Fingerprinting Research Platform',
      collectedAt,
      moduleVersion: 'task-3-audio-webgpu',
      modules,
    },
    ...Object.fromEntries(results),
  };
}

/** Keeps one collector failure from aborting the full fingerprint collection. */
async function runCollector(name, collector) {
  try {
    return await collector();
  } catch (error) {
    return {
      category: name,
      supported: false,
      values: {},
      warnings: [],
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
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
