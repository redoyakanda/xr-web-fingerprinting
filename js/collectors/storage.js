import { createCollectorResult, safeRead } from '../utils/utils.js';

const TEMP_PREFIX = 'xr-web-fingerprinting-test-';

/**
 * Collects passive storage capability signals. API availability, quota behavior,
 * persistence state, and temporary read/write behavior vary across browsers,
 * profiles, privacy modes, and devices, and can contribute to fingerprinting.
 * This collector only uses project-prefixed temporary artifacts and cleans them
 * up; it does not enumerate or read unrelated origin storage data.
 */
export async function collectStorageFingerprint() {
  const warnings = [];
  const errors = [];
  const nav = globalThis.navigator ?? {};
  const tempName = `${TEMP_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const values = {
    secureContext: safeRead(() => globalThis.window?.isSecureContext ?? globalThis.isSecureContext),
    cookies: testCookies(nav, tempName, warnings),
    localStorage: testWebStorage('localStorage', tempName),
    sessionStorage: testWebStorage('sessionStorage', tempName),
    indexedDB: await testIndexedDB(tempName, warnings),
    cacheAPI: await testCacheAPI(tempName, warnings),
    storageManager: await collectStorageManager(nav, warnings),
    serviceWorkerAvailable: Boolean(nav.serviceWorker),
    broadcastChannelAvailable: typeof globalThis.BroadcastChannel === 'function',
    sharedWorkerAvailable: typeof globalThis.SharedWorker === 'function',
    fileSystemInterfaces: {
      showOpenFilePicker: typeof globalThis.showOpenFilePicker === 'function',
      showSaveFilePicker: typeof globalThis.showSaveFilePicker === 'function',
      showDirectoryPicker: typeof globalThis.showDirectoryPicker === 'function',
      FileSystemHandle: typeof globalThis.FileSystemHandle === 'function',
      FileSystemFileHandle: typeof globalThis.FileSystemFileHandle === 'function',
      FileSystemDirectoryHandle: typeof globalThis.FileSystemDirectoryHandle === 'function',
    },
    originPrivateFileSystemAvailable: typeof nav.storage?.getDirectory === 'function',
  };

  return createCollectorResult('storage', true, values, warnings, errors);
}

function testWebStorage(property, tempName) {
  const result = { available: false, writeSucceeded: false, readSucceeded: false, removeSucceeded: false, error: null };
  const key = `${tempName}-${property}`;
  try {
    const storage = globalThis[property];
    result.available = Boolean(storage);
    if (!storage) return result;
    storage.setItem(key, '1');
    result.writeSucceeded = true;
    result.readSucceeded = storage.getItem(key) === '1';
    storage.removeItem(key);
    result.removeSucceeded = storage.getItem(key) === null;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    try { globalThis[property]?.removeItem?.(key); } catch {}
  }
  return result;
}

function testCookies(nav, tempName, warnings) {
  const result = { navigatorCookieEnabled: safeRead(() => nav.cookieEnabled), testAttempted: false, writeSucceeded: false, cleanupAttempted: false, error: null };
  const doc = globalThis.document;
  if (!doc || typeof doc.cookie !== 'string') return result;
  result.testAttempted = true;
  const name = `${tempName}-cookie`;
  try {
    doc.cookie = `${encodeURIComponent(name)}=1; SameSite=Lax; path=/`;
    result.writeSucceeded = doc.cookie.includes(`${encodeURIComponent(name)}=1`);
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      result.cleanupAttempted = true;
      doc.cookie = `${encodeURIComponent(name)}=; Max-Age=0; SameSite=Lax; path=/`;
    } catch (error) {
      warnings.push(`Temporary cookie cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return result;
}

async function testIndexedDB(tempName, warnings) {
  const result = { available: typeof globalThis.indexedDB === 'object' && globalThis.indexedDB !== null, openSucceeded: false, deleteSucceeded: false, blocked: false, error: null };
  if (!result.available) return result;
  const dbName = `${tempName}-indexeddb`;
  try {
    await new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('temp');
      request.onsuccess = () => { result.openSucceeded = true; request.result.close(); resolve(); };
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed.'));
      request.onblocked = () => { result.blocked = true; warnings.push('Temporary IndexedDB open was blocked.'); };
    });
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      await new Promise((resolve, reject) => {
        const deleteRequest = globalThis.indexedDB.deleteDatabase(dbName);
        deleteRequest.onsuccess = () => { result.deleteSucceeded = true; resolve(); };
        deleteRequest.onerror = () => reject(deleteRequest.error ?? new Error('IndexedDB delete failed.'));
        deleteRequest.onblocked = () => { result.blocked = true; warnings.push('Temporary IndexedDB cleanup was blocked.'); resolve(); };
      });
    } catch (error) {
      warnings.push(`Temporary IndexedDB cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return result;
}

async function testCacheAPI(tempName, warnings) {
  const result = { available: Boolean(globalThis.caches), openSucceeded: false, deleteSucceeded: false, error: null };
  if (!result.available) return result;
  const cacheName = `${tempName}-cache`;
  try {
    await globalThis.caches.open(cacheName);
    result.openSucceeded = true;
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      result.deleteSucceeded = Boolean(await globalThis.caches.delete(cacheName));
    } catch (error) {
      warnings.push(`Temporary Cache API cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return result;
}

async function collectStorageManager(nav, warnings) {
  const storage = nav.storage;
  const result = { available: Boolean(storage), estimate: null, persisted: null };
  if (!storage) return result;
  if (typeof storage.estimate === 'function') {
    try {
      const estimate = await storage.estimate();
      result.estimate = {
        quota: estimate?.quota ?? null,
        usage: estimate?.usage ?? null,
        usageDetails: estimate?.usageDetails ?? null,
      };
    } catch (error) {
      warnings.push(`navigator.storage.estimate() failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (typeof storage.persisted === 'function') {
    try {
      result.persisted = await storage.persisted();
    } catch (error) {
      warnings.push(`navigator.storage.persisted() failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return result;
}
