# Architecture

The project is a static browser application organized around small ES modules. The runtime starts at `js/core/app.js`, collects browser-exposed values, renders a pretty JSON view, and exports the result without requiring a backend.

## Core controller

`js/core/app.js` owns application flow. It wires button events, calls enabled collectors, adds collection metadata, and merges results into one final fingerprint object with top-level keys for `navigator`, `screen`, `window`, `canvas`, `webgl`, `audio`, `webgpu`, `webxr`, `permissions`, `storage`, `network`, `fonts`, `cssMedia`, `featureDetection`, and `gamepad`.

Collectors are registered in a single ordered array of `[moduleName, collectorFunction]` pairs. The controller derives metadata from that array and executes each collector through `runCollector()`, a defensive wrapper that awaits synchronous or asynchronous collectors and converts unexpected exceptions into the standard result envelope. This ensures one failed or unsupported API does not break the full fingerprint collection.

## Collectors

Collectors live in `js/collectors/`. Each collector returns the same envelope:

```js
{
  category: 'collector-name',
  supported: true,
  values: {},
  warnings: [],
  errors: []
}
```

Current collectors are:

- `navigator.js`: passive Navigator API properties.
- `screen.js`: Screen API dimensions and orientation metadata.
- `window.js`: viewport and visual viewport properties.
- `canvas.js`: deterministic 2D canvas drawing hashes and context metadata. Canvas is important because drawing output can vary by browser engine, operating system, font stack, antialiasing, emoji renderer, GPU, and driver.
- `webgl.js`: WebGL/WebGL2 support and graphics-stack metadata. WebGL is important because vendor strings, renderer strings, limits, extensions, and shader precision can expose high-entropy differences across devices and drivers.
- `audio.js`: deterministic offline Web Audio rendering. Audio is important for fingerprinting research because browser audio engines, CPU architectures, floating-point behavior, and signal-processing implementations can produce subtly different rendered samples for the same oscillator/compressor graph. The collector uses `OfflineAudioContext` where supported, hashes generated samples, records sample statistics, and never requests microphone access.
- `webgpu.js`: passive WebGPU capability enumeration. WebGPU is important because adapter features, limits, and exposed adapter metadata vary across GPU, driver, operating system, browser, and privacy settings. The collector checks `navigator.gpu`, requests an adapter without a device or extra permissions, records features/limits/adapter info when available, and returns warnings instead of throwing when WebGPU is unavailable, experimental, blocked, or privacy-restricted.
- `webxr.js`: passive WebXR capability enumeration. WebXR availability may reveal whether a browser is XR-capable, session-mode support may distinguish immersive browser environments, and exposed WebXR interfaces/extensions may provide additional fingerprinting features. The collector records secure-context status, `navigator.xr` availability, constructor/prototype exposure for core and optional WebXR interfaces, and `navigator.xr.isSessionSupported()` results for `inline`, `immersive-vr`, and `immersive-ar`. It does **not** call `requestSession()` or read pose, motion, controller movement, hand joints, eye tracking, camera passthrough, depth, hit-test, anchor, plane, mesh, or scene-understanding data.
- `permissions.js`: passive Permissions API state collection. It checks `navigator.permissions.query()` availability and queries a bounded descriptor list. Unsupported descriptor names and browser policy failures are represented per permission as `{ supported: false, state: null, error }` and also surfaced as non-fatal warnings; successful descriptors store only `granted`, `denied`, `prompt`, or `null`. The collector never calls APIs that request permission or access protected resources.
- `storage.js`: passive storage capability and behavior checks. It records web storage, IndexedDB, Cache API, StorageManager estimate/persisted state, cookie capability, service-worker exposure, BroadcastChannel, SharedWorker, File System Access interfaces, and OPFS availability. Temporary keys, cookies, databases, and caches use the `xr-web-fingerprinting-test-` prefix and cleanup is attempted immediately. Existing localStorage/sessionStorage keys, IndexedDB database lists, and cache names are not enumerated. `navigator.storage.persist()` is intentionally excluded because it may request or alter persistent-storage state.
- `network.js`: passive Network Information API and related interface checks. It reads coarse connection properties from `navigator.connection`, `navigator.mozConnection`, or `navigator.webkitConnection` when exposed, records `navigator.onLine`, and notes constructor availability for `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `WebTransport`, and `RTCPeerConnection`. It does not send requests, run speed tests, instantiate WebRTC, generate ICE candidates, discover IP addresses, inspect local networks, or collect geolocation.
- `fonts.js`: fixed-list font availability estimates. The list is documented in code and split into platform-common fonts, an XR/vendor candidate, and generic CSS families. The collector uses `document.fonts.check()` where possible and otherwise uses temporary offscreen DOM measurement that is removed immediately. It avoids arbitrary enumeration and never calls `queryLocalFonts()`.
- `cssMedia.js`: fixed `matchMedia()` probes for appearance, accessibility, input, display, scripting, and update queries. Combinations may be fingerprintable because they reveal display capabilities, accessibility preferences, installed input types, browser display mode, and rendering environment. No persistent listeners are attached.
- `featureDetection.js`: organized safe checks for API and constructor presence. API presence is distinct from permission availability, runtime capability, and actual feature use; this collector does not instantiate sensitive interfaces or call request methods.
- `gamepad.js`: a single passive `getGamepads()` snapshot of static/coarse metadata. Polling is intentionally excluded because repeated samples, button changes, axis changes, and timestamps could reveal controller movement or behavior.

Collectors should avoid permission prompts, user input collection, motion sensors, and unrelated fingerprinting surfaces unless explicitly added by a future task. Passive collection means reading already exposed capability/state values or using tightly scoped temporary artifacts without prompting the user or activating protected sensors; active collection, such as requesting a camera stream, XR session, persistent storage, geolocation, WebRTC ICE, or motion sensor data, is outside the current platform boundary.

## Asynchronous collectors

Collectors may be synchronous or asynchronous. For example, `canvas.js` and `audio.js` hash deterministic output with the asynchronous Web Crypto API, while `webgpu.js` awaits `navigator.gpu.requestAdapter()` and optional adapter info APIs, and `webxr.js` awaits passive `navigator.xr.isSessionSupported()` checks. `js/core/app.js` always awaits every collector through `Promise.all()`, so adding an async collector does not require special UI or export handling.

A collector should still catch API-specific errors internally when it can add useful warnings or fallback values. The core `runCollector()` wrapper is the final safety net for unexpected failures and returns `{ category, supported, values, warnings, errors }` for every module.

## UI renderer

`js/ui/renderer.js` updates the status panel, module summary, timestamp, and pretty JSON viewer. Keeping rendering separate from collection makes collector modules easier to test and extend. Because the pretty JSON viewer renders the complete fingerprint object, new collector top-level keys appear automatically once `app.js` includes them. The status panel also reports begin/complete messages for WebXR, Permissions, Storage, and Network, and summarizes non-fatal warning counts so unsupported or partial browser implementations remain visible without interrupting collection.

## JSON export module

`js/export/jsonExport.js` centralizes JSON formatting, clipboard copy, and local download behavior. The rest of the application passes complete fingerprint objects into this module instead of duplicating serialization logic.

## Shared utilities

`js/utils/utils.js` contains cross-cutting helpers such as safe property reads, timestamp creation, collector envelope creation, array normalization, and SHA-256 hashing. JSON export normalizes unsupported JavaScript values such as `undefined`, non-finite numbers, typed arrays, functions, symbols, and circular references so rendered and downloaded fingerprints remain serializable.

## Adding a new collector

1. Create a new file in `js/collectors/`, for example `example.js`.
2. Export a function that returns the standard collector envelope.
3. Keep collection deterministic, serializable, and side-effect-minimized.
4. Import the new collector in `js/core/app.js`.
5. Add the module name and function to the `collectors` array; metadata and result merging are derived from that registry.
6. Update `README.md`, this architecture document, and visible module lists in `index.html` as needed.
7. Add tests or sample data when a test harness is available.

## WebXR passive capability model

The WebXR collector intentionally distinguishes **interface availability** from **runtime session capability**. Interface availability means constructors such as `XRSystem`, `XRSession`, `XRWebGLLayer`, `XRHand`, or `XRDepthInformation` are exposed on `window`; this can be measured with safe feature detection without activating XR hardware. Runtime session capability means the browser reports whether a session mode such as `inline`, `immersive-vr`, or `immersive-ar` is supported through `navigator.xr.isSessionSupported()`. These session-mode checks are asynchronous but passive and do not create an XR session.

`requestSession()` is intentionally excluded from automatic collection because it can activate immersive XR flows, trigger permission or user-activation requirements, and expose sensor-backed objects such as frames, poses, input sources, hands, hit-test sources, anchors, depth information, or scene/environment data. Keeping WebXR collection passive preserves the project boundary: capability-based fingerprinting research without motion, pose, controller, eye, hand, camera, depth, or scene sensor streams.


## Unsupported API normalization

Collectors use a common envelope even when an API is missing, blocked, or partially implemented. Missing APIs usually set `supported: false` for that module or subfeature, put unavailable values at `null` or `false`, and add explanatory warnings instead of throwing. Browser-specific exceptions are captured as strings in `warnings`, `errors`, or subfeature `error` fields. This allows the full application to keep working even when Permissions, Storage, Network Information, or WebXR APIs are absent.

## Ethics and privacy

The platform is for academic browser measurement research. It has no backend, analytics, third-party scripts, or remote upload path, so fingerprint collection occurs locally in the browser. Users can inspect the pretty JSON result and copy or download it themselves. Passive permission-state collection does not access a protected resource merely because a permission is granted, and storage tests use temporary project-specific artifacts that are cleaned up rather than reading unrelated origin data. Network collection records coarse browser-exposed values only and should not be confused with active network measurement. No motion, pose, eye, hand, controller movement, controller behavior, camera, microphone, geolocation coordinate, IP address, or behavioral data is collected. No arbitrary font enumeration occurs and no sensitive device API is activated.
