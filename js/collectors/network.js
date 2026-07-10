import { createCollectorResult, safeRead } from '../utils/utils.js';

const CONNECTION_SOURCES = ['connection', 'mozConnection', 'webkitConnection'];

/**
 * Collects coarse, passive network capability values. These values and related
 * constructor availability can contribute to fingerprinting, but they are not
 * active network measurements: no speed tests, probe requests, WebRTC ICE, IP
 * discovery, or local-network inspection are performed.
 */
export function collectNetworkFingerprint() {
  const warnings = [];
  const errors = [];
  const nav = globalThis.navigator ?? {};
  const { source, connection } = getConnection(nav);
  const networkInformationAPIAvailable = Boolean(connection);

  if (!networkInformationAPIAvailable) {
    warnings.push('Network Information API is unavailable; only generic online/interface availability was collected.');
  }

  const values = {
    secureContext: safeRead(() => globalThis.window?.isSecureContext ?? globalThis.isSecureContext),
    online: safeRead(() => nav.onLine),
    networkInformationAPIAvailable,
    connectionObjectSource: source,
    connection: {
      effectiveType: connection ? safeRead(() => connection.effectiveType) : null,
      downlink: connection ? safeRead(() => connection.downlink) : null,
      downlinkMax: connection ? safeRead(() => connection.downlinkMax) : null,
      rtt: connection ? safeRead(() => connection.rtt) : null,
      saveData: connection ? safeRead(() => connection.saveData) : null,
      type: connection ? safeRead(() => connection.type) : null,
      changeEventListenerAvailable: connection ? typeof connection.addEventListener === 'function' : false,
    },
    relatedInterfaces: {
      fetch: typeof globalThis.fetch === 'function',
      xmlHttpRequest: typeof globalThis.XMLHttpRequest === 'function',
      webSocket: typeof globalThis.WebSocket === 'function',
      eventSource: typeof globalThis.EventSource === 'function',
      webTransport: typeof globalThis.WebTransport === 'function',
      rtcPeerConnection: typeof globalThis.RTCPeerConnection === 'function',
    },
  };

  return createCollectorResult('network', true, values, warnings, errors);
}

function getConnection(nav) {
  for (const source of CONNECTION_SOURCES) {
    const value = safeRead(() => nav[source]);
    if (value && !value.unavailable) {
      return { source, connection: value };
    }
  }

  return { source: null, connection: null };
}
