import { collectAudioFingerprint } from '../collectors/audio.js';
import { collectCanvasFingerprint } from '../collectors/canvas.js';
import { collectNavigatorFingerprint } from '../collectors/navigator.js';
import { collectNetworkFingerprint } from '../collectors/network.js';
import { collectPermissionsFingerprint } from '../collectors/permissions.js';
import { collectScreenFingerprint } from '../collectors/screen.js';
import { collectWebGLFingerprint } from '../collectors/webgl.js';
import { collectWebGPUFingerprint } from '../collectors/webgpu.js';
import { collectWebXRFingerprint } from '../collectors/webxr.js';
import { collectStorageFingerprint } from '../collectors/storage.js';
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
  ['webxr', collectWebXRFingerprint],
  ['permissions', collectPermissionsFingerprint],
  ['storage', collectStorageFingerprint],
  ['network', collectNetworkFingerprint],
];

const modules = collectors.map(([name]) => name);

/** Runs all enabled collector modules and merges their standard JSON envelopes. */
async function collectFingerprint(onCollectorStatus = () => {}) {
  const collectedAt = createTimestamp();

  const results = await Promise.all(
    collectors.map(async ([name, collector]) => [name, await runCollector(name, collector, onCollectorStatus)]),
  );

  return {
    metadata: {
      project: 'XR Web Fingerprinting Research Platform',
      collectedAt,
      moduleVersion: 'task-5-passive-browser-info',
      modules,
    },
    ...Object.fromEntries(results),
  };
}

/** Keeps one collector failure from aborting the full fingerprint collection. */
async function runCollector(name, collector, onCollectorStatus = () => {}) {
  try {
    onCollectorStatus(name, 'begin');
    const result = await collector();
    onCollectorStatus(name, 'complete', result);
    return result;
  } catch (error) {
    const fallbackResult = {
      category: name,
      supported: false,
      values: {},
      warnings: [],
      errors: [error instanceof Error ? error.message : String(error)],
    };
    onCollectorStatus(name, 'complete', fallbackResult);
    return fallbackResult;
  }
}

elements.collectButton.addEventListener('click', async () => {
  renderStatus('Collecting fingerprint...', elements);
  latestFingerprint = await collectFingerprint((name, phase, result) => {
    const labels = {
      webxr: 'WebXR',
      permissions: 'Permissions',
      storage: 'Storage',
      network: 'Network',
    };

    if (!labels[name]) {
      return;
    }

    if (phase === 'begin') {
      renderStatus(`${labels[name]} collection begins: passively checking browser-exposed capabilities...`, elements);
    }

    if (phase === 'complete') {
      const warningCount = result.warnings?.length ?? 0;
      const warningText = warningCount > 0 ? ` Non-fatal warnings: ${warningCount}.` : '';
      renderStatus(`${labels[name]} collection complete. Supported: ${result.supported ? 'yes' : 'no'}.${warningText}`, elements);
    }
  });
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
