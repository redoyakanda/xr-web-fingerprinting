import { createCollectorResult } from '../utils/utils.js';

const SCREEN_READER_API_NOTICE = 'Mainstream web browsers do not expose a general navigator.screenReader API.';

/** Passive DOM/environment snapshot; does not access an accessibility tree or screen-reader output. */
export function collectAccessibilityEnvironmentFingerprint() {
  const doc = globalThis.document;
  const win = globalThis.window ?? globalThis;
  const activeElement = describeElement(doc?.activeElement);
  const elementPrototype = win.Element?.prototype;
  const htmlElementPrototype = win.HTMLElement?.prototype;
  const values = {
    directScreenReaderDetectionAvailable: false,
    screenReaderAPINotice: SCREEN_READER_API_NOTICE,
    collectionMode: 'passive-snapshot',
    activeElement,
    initialFocusTarget: activeElement,
    tabindexBehavior: {
      activeElementTabIndex: activeElement?.tabIndex ?? null,
      negativeTabIndexProgrammaticFocusConvention: true,
      observedOnly: true,
    },
    focusVisible: {
      cssSelectorSupported: safeCssSupportsSelector(':focus-visible'),
      elementMatchesSupported: typeof elementPrototype?.matches === 'function',
    },
    elementInternals: feature(win, 'ElementInternals'),
    attachInternals: feature(elementPrototype, 'attachInternals'),
    ariaReflectedProperties: inspectAriaReflection(elementPrototype),
    inert: feature(htmlElementPrototype, 'inert'),
    popover: feature(htmlElementPrototype, 'popover'),
    htmlDialogElement: feature(win, 'HTMLDialogElement'),
    detailsSummary: {
      detailsElement: feature(win, 'HTMLDetailsElement'),
      summaryElementRecognized: doc ? doc.createElement('summary').constructor?.name !== 'HTMLUnknownElement' : false,
    },
    roleReflection: feature(elementPrototype, 'role'),
    visualViewport: describeVisualViewport(win.visualViewport),
    pointerEvent: feature(win, 'PointerEvent'),
    keyboardEvent: feature(win, 'KeyboardEvent'),
    inputDeviceCapabilities: feature(win, 'InputDeviceCapabilities'),
    virtualKeyboard: feature(globalThis.navigator, 'virtualKeyboard'),
  };
  return createCollectorResult('accessibilityEnvironment', Boolean(doc || win), values, [
    SCREEN_READER_API_NOTICE,
    'API availability and focus state are not evidence of screen-reader use or disability status.',
  ], []);
}

function describeElement(element) {
  if (!element) return null;
  return {
    tagName: element.tagName?.toLowerCase() ?? null,
    idPresent: Boolean(element.id),
    inputType: element.tagName === 'INPUT' ? element.type || null : null,
    role: element.getAttribute?.('role') ?? element.role ?? null,
    tabIndex: typeof element.tabIndex === 'number' ? element.tabIndex : null,
    contentEditable: element.contentEditable ?? null,
    disabled: typeof element.disabled === 'boolean' ? element.disabled : null,
  };
}
function safeCssSupportsSelector(selector) { try { return Boolean(globalThis.CSS?.supports?.(`selector(${selector})`)); } catch { return false; } }
function feature(root, name) { try { return Boolean(root && name in Object(root)); } catch { return false; } }
function inspectAriaReflection(proto) {
  const properties = ['ariaLabel', 'ariaDescription', 'ariaHidden', 'ariaExpanded', 'ariaControlsElements', 'ariaDescribedByElements', 'ariaLabelledByElements'];
  return Object.fromEntries(properties.map((name) => [name, feature(proto, name)]));
}
function describeVisualViewport(viewport) {
  if (!viewport) return { available: false, width: null, height: null, scale: null, offsetLeft: null, offsetTop: null };
  const number = (value) => Number.isFinite(value) ? value : null;
  return { available: true, width: number(viewport.width), height: number(viewport.height), scale: number(viewport.scale), offsetLeft: number(viewport.offsetLeft), offsetTop: number(viewport.offsetTop) };
}
