import assert from 'node:assert/strict';
import { collectWebXRFingerprint } from '../js/collectors/webxr.js';

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

function installBrowserGlobals({ xr, secure = true } = {}) {
  setGlobal('window', { isSecureContext: secure });
  setGlobal('navigator', xr === undefined ? {} : { xr });
}

function assertSchema(result) {
  assert.equal(typeof result.category, 'string');
  assert.equal(typeof result.supported, 'boolean');
  assert.equal(typeof result.values, 'object');
  assert.ok(Array.isArray(result.warnings));
  assert.ok(Array.isArray(result.errors));
}

installBrowserGlobals();
let result = await collectWebXRFingerprint();
assertSchema(result);
assert.equal(result.category, 'webxr');
assert.equal(result.supported, false);
assert.equal(result.values.navigatorXRAvailable, false);

installBrowserGlobals({
  xr: {
    async isSessionSupported(mode) {
      if (mode === 'immersive-ar') {
        throw new Error('AR blocked');
      }
      return mode === 'inline';
    },
  },
});
result = await collectWebXRFingerprint();
assertSchema(result);
assert.equal(result.supported, true);
assert.equal(result.values.sessionModes.inline, true);
assert.equal(result.values.sessionModes.immersiveVR, false);
assert.equal(result.values.sessionModes.immersiveAR, null);
assert.ok(result.warnings.some((warning) => warning.includes('immersive-ar')));

installBrowserGlobals({ xr: {} });
result = await collectWebXRFingerprint();
assertSchema(result);
assert.equal(result.supported, true);
assert.deepEqual(result.values.sessionModes, { inline: null, immersiveVR: null, immersiveAR: null });
assert.ok(result.warnings.some((warning) => warning.includes('isSessionSupported')));

console.log('webxr collector tests passed');
