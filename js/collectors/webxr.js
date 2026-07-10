import { createCollectorResult, safeRead } from '../utils/utils.js';

const SESSION_MODES = [
  ['inline', 'inline'],
  ['immersive-vr', 'immersiveVR'],
  ['immersive-ar', 'immersiveAR'],
];

const CORE_INTERFACES = [
  'XRSystem',
  'XRSession',
  'XRFrame',
  'XRReferenceSpace',
  'XRBoundedReferenceSpace',
  'XRView',
  'XRPose',
  'XRViewerPose',
  'XRInputSource',
  'XRWebGLLayer',
  'XRSessionEvent',
  'XRInputSourceEvent',
];

const LAYER_INTERFACES = [
  'XRWebGLLayer',
  'XRProjectionLayer',
  'XRQuadLayer',
  'XRCylinderLayer',
  'XREquirectLayer',
  'XRCubeLayer',
  'XRMediaBinding',
  'XRWebGLBinding',
];

const ENVIRONMENT_INTERFACES = [
  'XRAnchor',
  'XRHitTestSource',
  'XRTransientInputHitTestSource',
  'XRDepthInformation',
  'XRCPUDepthInformation',
  'XRWebGLDepthInformation',
  'XRLightProbe',
  'XRLightEstimate',
  'XRPlane',
  'XRMesh',
];

const INPUT_INTERFACES = [
  'XRInputSource',
  'XRHand',
  'XRJointPose',
];

const OPTIONAL_INTERFACES = [
  'XRDOMOverlayState',
];

/**
 * WebXR availability may reveal whether a browser is XR-capable, while
 * session-mode support can distinguish immersive browser environments and
 * exposed interfaces/extensions can add fingerprinting features. This collector
 * is intentionally capability-based rather than sensor-based: it never calls
 * requestSession(), never activates XR devices, and never reads pose, motion,
 * hand, eye, controller, camera, depth, hit-test, anchor, or scene data.
 */
export async function collectWebXRFingerprint() {
  const warnings = [];
  const errors = [];
  const xr = safeRead(() => navigator.xr);
  const navigatorXRAvailable = Boolean(xr && !xr.unavailable);

  const values = {
    secureContext: safeRead(() => window.isSecureContext),
    navigatorXRAvailable,
    sessionModes: {
      inline: null,
      immersiveVR: null,
      immersiveAR: null,
    },
    coreInterfaces: collectInterfaceGroup(CORE_INTERFACES),
    optionalInterfaces: collectInterfaceGroup(OPTIONAL_INTERFACES),
    layerInterfaces: collectInterfaceGroup(LAYER_INTERFACES),
    environmentInterfaces: collectInterfaceGroup(ENVIRONMENT_INTERFACES),
    inputInterfaces: collectInterfaceGroup(INPUT_INTERFACES),
    notes: [
      'Passive WebXR capability detection only; requestSession() is intentionally not called.',
      'Some WebXR features may remain hidden until an application explicitly requests and receives an XRSession.',
    ],
  };

  if (!values.secureContext) {
    warnings.push('WebXR generally requires a secure context; this page is not currently in one.');
  }

  if (!navigatorXRAvailable) {
    warnings.push('navigator.xr is unavailable; WebXR is unsupported, disabled, blocked by policy, or hidden by the browser.');
    return createCollectorResult('webxr', false, values, warnings, errors);
  }

  if (typeof xr.isSessionSupported !== 'function') {
    warnings.push('navigator.xr exists, but isSessionSupported() is unavailable. Session-mode capability cannot be queried passively.');
    return createCollectorResult('webxr', true, values, warnings, errors);
  }

  await Promise.all(SESSION_MODES.map(async ([mode, key]) => {
    try {
      values.sessionModes[key] = Boolean(await xr.isSessionSupported(mode));
    } catch (error) {
      values.sessionModes[key] = null;
      warnings.push(`isSessionSupported("${mode}") failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }));

  return createCollectorResult('webxr', true, values, warnings, errors);
}

function collectInterfaceGroup(names) {
  return Object.fromEntries(names.map((name) => [name, inspectInterface(name)]));
}

function inspectInterface(name) {
  const ctor = safeRead(() => window[name]);
  const available = typeof ctor === 'function';
  const prototype = available ? safeRead(() => Boolean(ctor.prototype)) : false;

  return {
    available,
    constructorType: ctor && !ctor.unavailable ? typeof ctor : null,
    prototypeAvailable: Boolean(prototype && !prototype.unavailable),
  };
}
