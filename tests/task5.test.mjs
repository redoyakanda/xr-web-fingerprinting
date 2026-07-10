import assert from 'node:assert/strict';
import { collectPermissionsFingerprint } from '../js/collectors/permissions.js';
import { collectStorageFingerprint } from '../js/collectors/storage.js';
import { collectNetworkFingerprint } from '../js/collectors/network.js';

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

function removeGlobal(name) {
  Reflect.deleteProperty(globalThis, name);
}

function assertSchema(result, category) {
  assert.equal(result.category, category);
  assert.equal(typeof result.supported, 'boolean');
  assert.equal(typeof result.values, 'object');
  assert.ok(Array.isArray(result.warnings));
  assert.ok(Array.isArray(result.errors));
}

setGlobal('window', { isSecureContext: true });
setGlobal('navigator', {});
let permissions = await collectPermissionsFingerprint();
assertSchema(permissions, 'permissions');
assert.equal(permissions.supported, false);
assert.equal(permissions.values.permissionsAPIAvailable, false);

let requestedPermission = false;
setGlobal('navigator', {
  permissions: {
    async query({ name }) {
      if (name === 'camera') throw new TypeError('Unsupported permission name');
      return { state: name === 'notifications' ? 'denied' : 'prompt' };
    },
  },
  geolocation: { getCurrentPosition() { requestedPermission = true; } },
});
permissions = await collectPermissionsFingerprint();
assertSchema(permissions, 'permissions');
assert.equal(permissions.values.queriedPermissions.camera.supported, false);
assert.match(permissions.values.queriedPermissions.camera.error, /Unsupported/);
assert.equal(requestedPermission, false);

const storageBacking = new Map([['existing', 'do-not-read']]);
const touchedKeys = [];
function makeStorage() {
  return {
    setItem(key, value) { touchedKeys.push(['set', key]); storageBacking.set(key, value); },
    getItem(key) { touchedKeys.push(['get', key]); return storageBacking.has(key) ? storageBacking.get(key) : null; },
    removeItem(key) { touchedKeys.push(['remove', key]); storageBacking.delete(key); },
  };
}
let persistCalled = false;
setGlobal('navigator', {
  cookieEnabled: true,
  storage: {
    async estimate() { return { quota: 10, usage: 1, usageDetails: { indexedDB: 1 } }; },
    async persisted() { return false; },
    async persist() { persistCalled = true; return true; },
  },
});
setGlobal('localStorage', makeStorage());
setGlobal('sessionStorage', makeStorage());
removeGlobal('indexedDB');
removeGlobal('caches');
const storage = await collectStorageFingerprint();
assertSchema(storage, 'storage');
assert.equal(storage.values.localStorage.removeSucceeded, true);
assert.equal(storage.values.sessionStorage.removeSucceeded, true);
assert.equal(storageBacking.has('existing'), true);
assert.equal(touchedKeys.some(([, key]) => key === 'existing'), false);
assert.equal([...storageBacking.keys()].some((key) => key.startsWith('xr-web-fingerprinting-test-')), false);
assert.equal(persistCalled, false);

let rtcCreated = false;
let fetchCalled = false;
function RTCPeerConnection() { rtcCreated = true; }
async function fetch() { fetchCalled = true; }
setGlobal('RTCPeerConnection', RTCPeerConnection);
setGlobal('fetch', fetch);
setGlobal('navigator', { onLine: true });
const network = collectNetworkFingerprint();
assertSchema(network, 'network');
assert.equal(network.values.networkInformationAPIAvailable, false);
assert.equal(network.values.relatedInterfaces.rtcPeerConnection, true);
assert.equal(rtcCreated, false);
assert.equal(fetchCalled, false);

console.log('task 5 collector tests passed');
