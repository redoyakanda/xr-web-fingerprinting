import { createCollectorResult, safeRead, sha256Hash } from '../utils/utils.js';

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 140;

/**
 * Canvas fingerprinting is important because the same deterministic drawing can
 * rasterize differently across GPU drivers, operating systems, browser engines,
 * installed fonts, antialiasing settings, and emoji renderers.
 */
export async function collectCanvasFingerprint() {
  const warnings = [];
  const errors = [];

  try {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const context = canvas.getContext('2d');
    if (!context) {
      return createCollectorResult('canvas', false, { dimensions: getCanvasDimensions(canvas) }, ['2D canvas context is unavailable.'], errors);
    }

    drawDeterministicCanvas(context);
    const dataUrl = canvas.toDataURL('image/png');
    const textMetrics = measureDeterministicText(context);

    return createCollectorResult('canvas', true, {
      dataUrlHash: await sha256Hash(dataUrl),
      renderedTextHash: await sha256Hash(JSON.stringify(textMetrics)),
      dimensions: getCanvasDimensions(canvas),
      context2d: getContext2dInfo(context),
    }, warnings, errors);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return createCollectorResult('canvas', false, {}, warnings, errors);
  }
}

function drawDeterministicCanvas(context) {
  const gradient = context.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#1238a8');
  gradient.addColorStop(0.5, '#25d0a2');
  gradient.addColorStop(1, '#ffcc4d');

  context.fillStyle = gradient;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(255, 64, 129, 0.62)';
  context.beginPath();
  context.arc(78, 70, 42, 0, Math.PI * 2);
  context.fill();

  context.globalCompositeOperation = 'source-over';
  context.strokeStyle = 'rgba(17, 24, 39, 0.88)';
  context.lineWidth = 3.25;
  context.strokeRect(132.5, 22.5, 92, 66);

  context.fillStyle = '#111827';
  context.font = '18px Arial, Helvetica, sans-serif';
  context.fillText('XR fingerprint canvas Δ', 18, 118);
  context.font = '24px serif';
  context.fillText('WebGL + Canvas 🔬🧪', 122, 58);
}

function measureDeterministicText(context) {
  context.font = '19px Arial, Helvetica, sans-serif';
  const ascii = context.measureText('XR fingerprint canvas');
  context.font = '24px serif';
  const emoji = context.measureText('🔬🧪');

  return {
    asciiWidth: ascii.width,
    emojiWidth: emoji.width,
    baseline: safeRead(() => ascii.actualBoundingBoxAscent),
  };
}

function getCanvasDimensions(canvas) {
  return {
    width: canvas.width,
    height: canvas.height,
  };
}

function getContext2dInfo(context) {
  return {
    supported: true,
    alpha: safeRead(() => context.getContextAttributes?.().alpha),
    colorSpace: safeRead(() => context.getContextAttributes?.().colorSpace),
    direction: safeRead(() => context.direction),
    filter: safeRead(() => context.filter),
    fontKerning: safeRead(() => context.fontKerning),
    imageSmoothingEnabled: safeRead(() => context.imageSmoothingEnabled),
    imageSmoothingQuality: safeRead(() => context.imageSmoothingQuality),
    textBaseline: safeRead(() => context.textBaseline),
  };
}
