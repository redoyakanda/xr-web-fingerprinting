import { createCollectorResult } from '../utils/utils.js';

/** Feature presence only: no constructors, permission prompts, or sensitive APIs are activated. */
export function collectAccessibilityAPISurfaceFingerprint() {
  const win = globalThis.window ?? globalThis;
  const nav = globalThis.navigator;
  const element = win.Element?.prototype;
  const html = win.HTMLElement?.prototype;
  const groups = {
    ariaReflection: entries([
      ['ariaLabel', element, 'Element.prototype'], ['ariaDescription', element, 'Element.prototype'],
      ['ariaHidden', element, 'Element.prototype'], ['ariaExpanded', element, 'Element.prototype'],
      ['role', element, 'Element.prototype'], ['ElementInternals', win, 'window'], ['attachInternals', element, 'Element.prototype'],
    ]),
    focusNavigation: entries([
      ['focus', html, 'HTMLElement.prototype'], ['blur', html, 'HTMLElement.prototype'], ['tabIndex', html, 'HTMLElement.prototype'],
      ['activeElement', globalThis.document, 'document'], ['focusVisibleSelector', globalThis.CSS, 'CSS', safeFocusVisibleSupport()],
    ]),
    semanticControls: entries([
      ['HTMLDialogElement', win, 'window'], ['HTMLDetailsElement', win, 'window'], ['inert', html, 'HTMLElement.prototype'],
      ['popover', html, 'HTMLElement.prototype'], ['showPopover', html, 'HTMLElement.prototype'],
    ]),
    accessibilityCSS: entries([
      ['supports', globalThis.CSS, 'CSS'], ['matchMedia', win, 'window'], ['forcedColors', win, 'window', safeMedia('(forced-colors: active)')],
      ['prefersReducedMotion', win, 'window', safeMedia('(prefers-reduced-motion: reduce)')],
    ]),
    inputModality: entries([
      ['PointerEvent', win, 'window'], ['KeyboardEvent', win, 'window'], ['InputDeviceCapabilities', win, 'window'],
      ['virtualKeyboard', nav, 'navigator'], ['VisualViewport', win, 'window'],
    ]),
    browserAccessibilityAPIs: entries([
      ['accessibilityTree', nav, 'navigator', false], ['screenReader', nav, 'navigator', false], ['getComputedAccessibleNode', win, 'window'],
    ]),
  };
  return createCollectorResult('accessibilityAPISurface', true, {
    detectionMode: 'safe-feature-detection-only',
    directScreenReaderDetectionAvailable: false,
    groups,
  }, ['Feature availability does not show that assistive technology or a screen reader is in use. Mainstream web browsers do not expose a general navigator.screenReader API.'], []);
}

function entries(definitions) { return Object.fromEntries(definitions.map(([name, root, location, override]) => [name, inspect(root, name, location, override)])); }
function inspect(root, name, location, override) {
  try {
    const available = override === undefined ? Boolean(root && name in Object(root)) : Boolean(override);
    const value = available && override === undefined ? root[name] : undefined;
    return { available, location, type: available ? (override === undefined ? typeof value : 'boolean') : null };
  } catch { return { available: false, location, type: null }; }
}
function safeFocusVisibleSupport() { try { return Boolean(globalThis.CSS?.supports?.('selector(:focus-visible)')); } catch { return false; } }
function safeMedia(query) { try { return typeof globalThis.window?.matchMedia === 'function' && Boolean(globalThis.window.matchMedia(query)); } catch { return false; } }
