import assert from 'node:assert/strict';
import { collectAccessibilityPreferencesFingerprint } from '../js/collectors/accessibilityPreferences.js';
import { collectAccessibilityEnvironmentFingerprint } from '../js/collectors/accessibilityEnvironment.js';
import { collectAccessibilityAPISurfaceFingerprint } from '../js/collectors/accessibilityAPISurface.js';

for (const collector of [collectAccessibilityPreferencesFingerprint, collectAccessibilityEnvironmentFingerprint, collectAccessibilityAPISurfaceFingerprint]) {
  const result = collector();
  assert.deepEqual(Object.keys(result), ['category', 'supported', 'values', 'warnings', 'errors']);
}

const preferences = collectAccessibilityPreferencesFingerprint();
for (const name of ['prefers-reduced-motion', 'prefers-reduced-transparency', 'prefers-contrast', 'forced-colors', 'inverted-colors', 'prefers-color-scheme', 'prefers-reduced-data', 'color-gamut', 'dynamic-range', 'video-dynamic-range', 'pointer', 'any-pointer', 'hover', 'any-hover', 'orientation', 'display-mode']) {
  const value = preferences.values.preferences[name];
  assert.ok(value && 'query' in value && 'supported' in value && 'observedValue' in value);
}
assert.equal(collectAccessibilityEnvironmentFingerprint().values.directScreenReaderDetectionAvailable, false);
assert.equal(typeof collectAccessibilityEnvironmentFingerprint().values.visualViewport.available, 'boolean');
const api = collectAccessibilityAPISurfaceFingerprint();
for (const group of ['ariaReflection', 'focusNavigation', 'semanticControls', 'accessibilityCSS', 'inputModality', 'browserAccessibilityAPIs']) {
  assert.ok(api.values.groups[group]);
  for (const feature of Object.values(api.values.groups[group])) assert.deepEqual(Object.keys(feature), ['available', 'location', 'type']);
}
console.log('accessibility collector tests passed');
