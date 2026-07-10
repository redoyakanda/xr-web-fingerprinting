import { createCollectorResult, safeRead } from '../utils/utils.js';

/**
 * WebGL fingerprinting is important because graphics stacks expose details from
 * the browser, GPU, driver, shader compiler, and enabled extensions, producing
 * high-entropy signals even without reading user input or motion sensors.
 */
export function collectWebGLFingerprint() {
  const warnings = [];
  const errors = [];
  try {
    const canvas = document.createElement('canvas');
    const webgl = getContext(canvas, 'webgl') || getContext(canvas, 'experimental-webgl');
    const webgl2 = getContext(canvas, 'webgl2');

    if (!webgl && !webgl2) {
      return createCollectorResult('webgl', false, { webglSupported: false, webgl2Supported: false }, ['WebGL APIs are unavailable.'], errors);
    }

    const primaryContext = webgl2 || webgl;
    const values = {
      webglSupported: Boolean(webgl),
      webgl2Supported: Boolean(webgl2),
      primaryContext: webgl2 ? 'webgl2' : 'webgl',
      ...collectContextValues(primaryContext),
    };

    return createCollectorResult('webgl', true, values, warnings, errors);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return createCollectorResult('webgl', false, {}, warnings, errors);
  }
}

function getContext(canvas, type) {
  try {
    return canvas.getContext(type, { failIfMajorPerformanceCaveat: false });
  } catch {
    return null;
  }
}

function collectContextValues(gl) {
  const debugInfo = getDebugRendererInfo(gl);

  return {
    vendor: safeRead(() => gl.getParameter(gl.VENDOR)),
    renderer: safeRead(() => gl.getParameter(gl.RENDERER)),
    unmaskedVendor: debugInfo ? safeRead(() => gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : null,
    unmaskedRenderer: debugInfo ? safeRead(() => gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : null,
    version: safeRead(() => gl.getParameter(gl.VERSION)),
    shadingLanguageVersion: safeRead(() => gl.getParameter(gl.SHADING_LANGUAGE_VERSION)),
    supportedExtensions: safeRead(() => gl.getSupportedExtensions() || []),
    parameters: {
      maxTextureSize: safeRead(() => gl.getParameter(gl.MAX_TEXTURE_SIZE)),
      maxViewportDimensions: safeRead(() => Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS))),
      maxRenderbufferSize: safeRead(() => gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)),
      maxVertexAttributes: safeRead(() => gl.getParameter(gl.MAX_VERTEX_ATTRIBS)),
      maxVaryingVectors: safeRead(() => gl.getParameter(gl.MAX_VARYING_VECTORS)),
      maxTextureImageUnits: safeRead(() => gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)),
      maxCubeMapTextureSize: safeRead(() => gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE)),
    },
    shaderPrecision: collectShaderPrecision(gl),
  };
}

function getDebugRendererInfo(gl) {
  try {
    return gl.getExtension('WEBGL_debug_renderer_info');
  } catch {
    return null;
  }
}

function collectShaderPrecision(gl) {
  const shaderTypes = {
    vertex: gl.VERTEX_SHADER,
    fragment: gl.FRAGMENT_SHADER,
  };
  const precisionTypes = {
    lowFloat: gl.LOW_FLOAT,
    mediumFloat: gl.MEDIUM_FLOAT,
    highFloat: gl.HIGH_FLOAT,
    lowInt: gl.LOW_INT,
    mediumInt: gl.MEDIUM_INT,
    highInt: gl.HIGH_INT,
  };

  return Object.fromEntries(
    Object.entries(shaderTypes).map(([shaderName, shaderType]) => [
      shaderName,
      Object.fromEntries(
        Object.entries(precisionTypes).map(([precisionName, precisionType]) => [
          precisionName,
          safeRead(() => {
            const format = gl.getShaderPrecisionFormat(shaderType, precisionType);
            return format ? { rangeMin: format.rangeMin, rangeMax: format.rangeMax, precision: format.precision } : null;
          }),
        ]),
      ),
    ]),
  );
}
