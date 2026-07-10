import assert from 'node:assert/strict';
import { collectFontsFingerprint, PREDEFINED_FONTS } from '../js/collectors/fonts.js';
import { collectCssMediaFingerprint } from '../js/collectors/cssMedia.js';
import { collectFeatureDetectionFingerprint } from '../js/collectors/featureDetection.js';
import { collectGamepadFingerprint } from '../js/collectors/gamepad.js';

function setGlobal(name, value) { Object.defineProperty(globalThis, name, { configurable: true, writable: true, value }); }
function removeGlobal(name) { Reflect.deleteProperty(globalThis, name); }
function assertSchema(result, category) {
  assert.equal(result.category, category);
  assert.equal(typeof result.supported, 'boolean');
  assert.equal(typeof result.values, 'object');
  assert.ok(Array.isArray(result.warnings));
  assert.ok(Array.isArray(result.errors));
}

removeGlobal('document');
let fonts = collectFontsFingerprint();
assertSchema(fonts, 'fonts');
assert.equal(fonts.values.fontLoadingAPIAvailable, false);
assert.equal(fonts.values.testedFontCount, PREDEFINED_FONTS.length);
assert.equal(fonts.values.method, 'unsupported');
assert.equal(Object.keys(fonts.values.fonts).length, PREDEFINED_FONTS.length);

let removed = 0;
setGlobal('document', {
  body: { appendChild(node) { node.offsetWidth = node.style.cssText.includes('Arial') ? 101 : 100; } },
  createElement() { return { style: {}, textContent: '', offsetWidth: 100, remove() { removed += 1; } }; },
});
fonts = collectFontsFingerprint();
assertSchema(fonts, 'fonts');
assert.equal(fonts.values.method, 'width-measurement');
assert.ok(removed > 0);
assert.equal('queryLocalFonts' in globalThis, false);

removeGlobal('window');
let css = collectCssMediaFingerprint();
assertSchema(css, 'cssMedia');
assert.equal(css.values.matchMediaAvailable, false);
assert.ok(Object.values(css.values.queries).every((entry) => typeof entry.matches === 'boolean'));

let listenersAttached = false;
setGlobal('window', { matchMedia(query) { return { media: query, matches: query.includes('hover'), addEventListener() { listenersAttached = true; }, addListener() { listenersAttached = true; } }; } });
css = collectCssMediaFingerprint();
assertSchema(css, 'cssMedia');
assert.equal(css.values.matchMediaAvailable, true);
assert.equal(listenersAttached, false);

let rtcCreated = false;
function RTCPeerConnection() { rtcCreated = true; }
setGlobal('window', { RTCPeerConnection, isSecureContext: true });
setGlobal('navigator', { permissions: { query() { throw new Error('must not query'); } }, getGamepads() { return []; } });
const features = collectFeatureDetectionFingerprint();
assertSchema(features, 'featureDetection');
assert.equal(rtcCreated, false);
assert.equal(features.values.categories.connectivity.features.RTCPeerConnection.available, true);

let gamepadCalls = 0;
setGlobal('window', { ongamepadconnected: null, ongamepaddisconnected: null, Gamepad: function Gamepad() {}, GamepadButton: function GamepadButton() {} });
setGlobal('navigator', { getGamepads() { gamepadCalls += 1; return [null, { index: 1, id: 'Pad', mapping: 'standard', connected: true, buttons: [{ pressed: true, value: 1 }], axes: [0.1, 0.2], vibrationActuator: { type: 'dual-rumble' }, timestamp: 123 }]; } });
const gamepad = collectGamepadFingerprint();
assertSchema(gamepad, 'gamepad');
assert.equal(gamepadCalls, 1);
assert.equal(gamepad.values.nullSlotCount, 1);
assert.equal(gamepad.values.gamepads[0].buttonCount, 1);
assert.equal(gamepad.values.gamepads[0].axisCount, 2);
assert.equal('axes' in gamepad.values.gamepads[0], false);
assert.equal('buttons' in gamepad.values.gamepads[0], false);
assert.equal('timestamp' in gamepad.values.gamepads[0], false);

console.log('task 6 collector tests passed');
