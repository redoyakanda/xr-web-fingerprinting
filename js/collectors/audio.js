import { createCollectorResult, safeRead, sha256Hash } from '../utils/utils.js';

const RENDER_CHANNELS = 1;
const RENDER_LENGTH = 5000;
const RENDER_SAMPLE_RATE = 44100;
const SAMPLE_SLICE_SIZE = 32;

/**
 * Audio fingerprinting is relevant because deterministic Web Audio rendering can
 * differ subtly across browser engines, CPU architectures, floating-point math,
 * and audio pipeline implementations. This collector generates offline audio
 * only; it never opens a microphone, uses media devices, or requests permission.
 */
export async function collectAudioFingerprint() {
  const warnings = [];
  const errors = [];

  try {
    const OfflineAudioContextConstructor = window.OfflineAudioContext || window.webkitOfflineAudioContext;

    if (!OfflineAudioContextConstructor) {
      return createCollectorResult('audio', false, {
        offlineAudioContextSupported: false,
      }, ['OfflineAudioContext is unavailable. Audio fingerprint was skipped.'], errors);
    }

    const context = new OfflineAudioContextConstructor(RENDER_CHANNELS, RENDER_LENGTH, RENDER_SAMPLE_RATE);
    const oscillator = context.createOscillator();
    const compressor = context.createDynamicsCompressor();

    oscillator.type = 'triangle';
    oscillator.frequency.value = 10000;

    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    oscillator.connect(compressor);
    compressor.connect(context.destination);
    oscillator.start(0);

    const renderedBuffer = await context.startRendering();
    const channelData = renderedBuffer.getChannelData(0);
    const statistics = summarizeSamples(channelData);
    const quantizedSamples = Array.from(channelData, (sample) => sample.toFixed(8)).join(',');

    return createCollectorResult('audio', true, {
      offlineAudioContextSupported: true,
      sampleRate: renderedBuffer.sampleRate,
      channelCount: renderedBuffer.numberOfChannels,
      renderedBufferLength: renderedBuffer.length,
      duration: renderedBuffer.duration,
      sampleHash: await sha256Hash(quantizedSamples),
      statistics,
      sampleSlice: Array.from(channelData.slice(0, SAMPLE_SLICE_SIZE), (sample) => Number(sample.toFixed(8))),
      compressorSettings: {
        threshold: safeRead(() => compressor.threshold.value),
        knee: safeRead(() => compressor.knee.value),
        ratio: safeRead(() => compressor.ratio.value),
        attack: safeRead(() => compressor.attack.value),
        release: safeRead(() => compressor.release.value),
      },
    }, warnings, errors);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return createCollectorResult('audio', false, {}, warnings, errors);
  }
}

function summarizeSamples(samples) {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (const sample of samples) {
    min = Math.min(min, sample);
    max = Math.max(max, sample);
    sum += sample;
  }

  return {
    min: Number(min.toFixed(8)),
    max: Number(max.toFixed(8)),
    mean: Number((sum / samples.length).toFixed(8)),
  };
}
