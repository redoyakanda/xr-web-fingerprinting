import { createCollectorResult, safeRead } from '../utils/utils.js';

/**
 * WebGPU fingerprinting is relevant because adapter capabilities, features,
 * limits, and exposed adapter metadata can vary by GPU, driver, browser, OS,
 * and privacy settings. This collector performs passive capability enumeration
 * only and does not request XR, camera, microphone, or motion-sensor access.
 */
export async function collectWebGPUFingerprint() {
  const warnings = [];
  const errors = [];
  const gpu = navigator.gpu;

  if (!gpu) {
    return createCollectorResult('webgpu', false, {
      webgpuSupported: false,
      adapterAvailable: false,
    }, ['navigator.gpu is unavailable. WebGPU may be unsupported, disabled, experimental, or blocked by browser policy.'], errors);
  }

  try {
    const adapter = await gpu.requestAdapter({ powerPreference: 'low-power' });

    if (!adapter) {
      return createCollectorResult('webgpu', false, {
        webgpuSupported: true,
        adapterAvailable: false,
      }, ['navigator.gpu exists, but requestAdapter() returned no adapter. WebGPU may be blocked or disabled.'], errors);
    }

    const adapterInfo = await collectAdapterInfo(adapter, warnings);

    return createCollectorResult('webgpu', true, {
      webgpuSupported: true,
      adapterAvailable: true,
      features: collectFeatures(adapter),
      limits: collectLimits(adapter),
      adapterInfo,
      isFallbackAdapter: safeRead(() => adapter.isFallbackAdapter),
    }, warnings, errors);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return createCollectorResult('webgpu', false, {
      webgpuSupported: true,
      adapterAvailable: false,
    }, warnings, errors);
  }
}

function collectFeatures(adapter) {
  return safeRead(() => Array.from(adapter.features || []).sort());
}

function collectLimits(adapter) {
  const limits = safeRead(() => adapter.limits);

  if (!limits || limits.unavailable) {
    return limits;
  }

  const keys = new Set([
    ...Object.keys(limits),
    'maxTextureDimension1D',
    'maxTextureDimension2D',
    'maxTextureDimension3D',
    'maxTextureArrayLayers',
    'maxBindGroups',
    'maxBindGroupsPlusVertexBuffers',
    'maxBindingsPerBindGroup',
    'maxDynamicUniformBuffersPerPipelineLayout',
    'maxDynamicStorageBuffersPerPipelineLayout',
    'maxSampledTexturesPerShaderStage',
    'maxSamplersPerShaderStage',
    'maxStorageBuffersPerShaderStage',
    'maxStorageTexturesPerShaderStage',
    'maxUniformBuffersPerShaderStage',
    'maxUniformBufferBindingSize',
    'maxStorageBufferBindingSize',
    'minUniformBufferOffsetAlignment',
    'minStorageBufferOffsetAlignment',
    'maxVertexBuffers',
    'maxBufferSize',
    'maxVertexAttributes',
    'maxVertexBufferArrayStride',
    'maxInterStageShaderComponents',
    'maxInterStageShaderVariables',
    'maxColorAttachments',
    'maxColorAttachmentBytesPerSample',
    'maxComputeWorkgroupStorageSize',
    'maxComputeInvocationsPerWorkgroup',
    'maxComputeWorkgroupSizeX',
    'maxComputeWorkgroupSizeY',
    'maxComputeWorkgroupSizeZ',
    'maxComputeWorkgroupsPerDimension',
  ]);

  return Object.fromEntries(
    Array.from(keys)
      .map((key) => [key, safeRead(() => limits[key])])
      .filter(([, value]) => value !== null),
  );
}

async function collectAdapterInfo(adapter, warnings) {
  if ('info' in adapter) {
    const info = safeRead(() => adapter.info);
    if (info && !info.unavailable) {
      return normalizeAdapterInfo(info);
    }
  }

  if (typeof adapter.requestAdapterInfo === 'function') {
    try {
      return normalizeAdapterInfo(await adapter.requestAdapterInfo());
    } catch (error) {
      warnings.push(`Adapter info request failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  warnings.push('Adapter info is unavailable in this browser or hidden by privacy protections.');
  return null;
}

function normalizeAdapterInfo(info) {
  if (!info) {
    return null;
  }

  return {
    vendor: safeRead(() => info.vendor),
    architecture: safeRead(() => info.architecture),
    device: safeRead(() => info.device),
    description: safeRead(() => info.description),
  };
}
