import { createCollectorResult } from '../utils/utils.js';

const FEATURE_CATEGORIES = {
  browserPlatform: [['userAgentData', 'navigator'], ['deviceMemory', 'navigator'], ['hardwareConcurrency', 'navigator'], ['maxTouchPoints', 'navigator'], ['pdfViewerEnabled', 'navigator'], ['webdriver', 'navigator'], ['cookieEnabled', 'navigator'], ['doNotTrack', 'navigator']],
  graphics: [['HTMLCanvasElement', 'window'], ['OffscreenCanvas', 'window'], ['WebGLRenderingContext', 'window'], ['WebGL2RenderingContext', 'window'], ['WebGLQuery', 'window'], ['GPU', 'window'], ['GPUAdapter', 'window'], ['GPUDevice', 'window'], ['ImageBitmap', 'window'], ['createImageBitmap', 'window']],
  audioMedia: [['AudioContext', 'window'], ['OfflineAudioContext', 'window'], ['MediaCapabilities', 'window'], ['mediaCapabilities', 'navigator'], ['MediaRecorder', 'window'], ['AudioWorklet', 'window'], ['VideoDecoder', 'window'], ['AudioDecoder', 'window'], ['VideoEncoder', 'window'], ['AudioEncoder', 'window']],
  xr: [['xr', 'navigator'], ['XRSystem', 'window'], ['XRSession', 'window'], ['XRFrame', 'window'], ['XRWebGLLayer', 'window'], ['XRWebGLBinding', 'window'], ['XRProjectionLayer', 'window'], ['XRMediaBinding', 'window'], ['XRHand', 'window'], ['XRAnchor', 'window'], ['XRHitTestSource', 'window'], ['XRLightProbe', 'window'], ['XRPlane', 'window'], ['XRMesh', 'window']],
  input: [['getGamepads', 'navigator'], ['Gamepad', 'window'], ['GamepadButton', 'window'], ['PointerEvent', 'window'], ['TouchEvent', 'window'], ['KeyboardEvent', 'window'], ['virtualKeyboard', 'navigator', 'VirtualKeyboard'], ['InputDeviceCapabilities', 'window']],
  storageExecution: [['indexedDB', 'window'], ['caches', 'window'], ['localStorage', 'window'], ['sessionStorage', 'window'], ['BroadcastChannel', 'window'], ['SharedWorker', 'window'], ['serviceWorker', 'navigator', 'ServiceWorker'], ['WebAssembly', 'globalThis'], ['Atomics', 'globalThis'], ['SharedArrayBuffer', 'globalThis'], ['crossOriginIsolated', 'globalThis']],
  connectivity: [['fetch', 'globalThis'], ['XMLHttpRequest', 'window'], ['WebSocket', 'window'], ['EventSource', 'window'], ['WebTransport', 'window'], ['RTCPeerConnection', 'window'], ['connection', 'navigator']],
  deviceAccess: [['bluetooth', 'navigator'], ['usb', 'navigator'], ['serial', 'navigator'], ['hid', 'navigator'], ['nfc', 'navigator'], ['BatteryManager', 'window'], ['WakeLock', 'window'], ['IdleDetector', 'window']],
  fileClipboard: [['showOpenFilePicker', 'window'], ['showSaveFilePicker', 'window'], ['showDirectoryPicker', 'window'], ['FileSystemHandle', 'window'], ['FileSystemFileHandle', 'window'], ['FileSystemDirectoryHandle', 'window'], ['clipboard', 'navigator']],
  security: [['isSecureContext', 'window'], ['crossOriginIsolated', 'globalThis'], ['trustedTypes', 'window'], ['subtle', 'crypto', 'crypto.subtle'], ['Credential', 'window'], ['PublicKeyCredential', 'window'], ['PaymentRequest', 'window'], ['permissions', 'navigator', 'Permissions API']],
};

/**
 * Safe feature detection only. Interface presence is not permission state,
 * runtime capability, or actual use: no constructors are instantiated and no
 * sensitive APIs (RTC, Bluetooth, USB, HID, Serial, NFC, files, payments,
 * credentials, media streams, or permissions prompts) are invoked.
 */
export function collectFeatureDetectionFingerprint() {
  const warnings = ['Feature availability is not equivalent to permission availability, runtime capability, or active feature use.'];
  const errors = [];
  const categories = {};
  const summary = { tested: 0, available: 0, unavailable: 0, errors: 0 };

  for (const [category, features] of Object.entries(FEATURE_CATEGORIES)) {
    const entries = {};
    const totals = { tested: 0, available: 0, unavailable: 0, errors: 0 };
    for (const [name, location, label = name] of features) {
      const result = inspectFeature(name, location);
      entries[label] = result;
      totals.tested += 1;
      summary.tested += 1;
      if (result.error) { totals.errors += 1; summary.errors += 1; }
      if (result.available) { totals.available += 1; summary.available += 1; } else { totals.unavailable += 1; summary.unavailable += 1; }
    }
    categories[category] = { totals, features: entries };
  }

  return createCollectorResult('featureDetection', true, {
    secureContext: Boolean(globalThis.window?.isSecureContext ?? globalThis.isSecureContext),
    crossOriginIsolated: Boolean(globalThis.crossOriginIsolated),
    categories,
    summary,
  }, warnings, errors);
}

function inspectFeature(name, location) {
  try {
    const root = getRoot(location);
    const available = root != null && name in Object(root);
    const value = available ? root[name] : undefined;
    return { available, location: normalizeLocation(location), type: available ? typeof value : null };
  } catch (error) {
    return { available: false, location: normalizeLocation(location), type: null, error: error instanceof Error ? error.message : String(error) };
  }
}

function getRoot(location) {
  if (location === 'window') return globalThis.window ?? globalThis;
  if (location === 'navigator') return globalThis.navigator;
  if (location === 'document') return globalThis.document;
  if (location === 'crypto') return globalThis.crypto;
  return globalThis;
}

function normalizeLocation(location) {
  return ['window', 'navigator', 'globalThis', 'document'].includes(location) ? location : 'other';
}
