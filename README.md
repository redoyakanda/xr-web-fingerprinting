# XR Web Fingerprinting Research Platform

A foundation prototype for studying browser-exposed fingerprinting surfaces in XR/WebXR browsers and traditional desktop browsers.

This project is intended for academic browser measurement research. It does **not** collect user input, does **not** collect motion sensor data, and implements passive Gamepad, Fonts, CSS Media Queries, and broad feature-detection collectors without requesting permissions or activating sensitive devices.

## Implemented modules

- `navigator`: passive Navigator API properties such as user agent, platform, languages, touch points, and hardware concurrency.
- `screen`: Screen API dimensions, color depth, pixel depth, and orientation metadata.
- `window`: viewport and window dimensions, device pixel ratio, offsets, and visual viewport metadata.
- `canvas`: deterministic offscreen 2D canvas rendering with hashed image and text outputs, dimensions, and 2D context metadata.
- `webgl`: WebGL/WebGL2 support, vendor and renderer strings, unmasked debug renderer information when available, extensions, major graphics limits, and shader precision values.
- `audio`: deterministic Web Audio API rendering with `OfflineAudioContext`, oscillator/compressor processing, sample statistics, and a hash of rendered samples. This module uses generated offline audio only; it does **not** access the microphone, call `getUserMedia`, enumerate media devices, or request audio permissions.
- `webgpu`: passive WebGPU capability enumeration, including support status, adapter features, adapter limits, adapter info when exposed by the browser, and warnings when WebGPU or adapter metadata is blocked or unavailable. This module does **not** request XR, camera, microphone, or motion-sensor permissions.
- `webxr`: passive WebXR capability enumeration, including secure-context status, `navigator.xr` availability, browser-exposed WebXR constructor/prototype availability, and `isSessionSupported()` results for `inline`, `immersive-vr`, and `immersive-ar`. This module does **not** call `requestSession()`, request immersive sessions, request XR permissions, or collect motion, pose, orientation, eye, hand, controller, camera passthrough, depth, hit-test, anchor, scene-understanding, or other behavioral/environment sensor streams. Some WebXR capabilities may be hidden until a site explicitly requests a session, so this module intentionally measures only passively exposed capabilities.
- `permissions`: passive Permissions API state checks. It only reads browser-reported permission states with `navigator.permissions.query()` where supported; it does **not** request permissions or access protected resources such as camera, microphone, geolocation, clipboard, or sensors.
- `storage`: passive storage capability checks for web storage, IndexedDB, Cache API, StorageManager, cookies, service workers, worker/channel interfaces, file-system interfaces, and OPFS exposure. Temporary project-specific artifacts prefixed with `xr-web-fingerprinting-test-` are created only when needed and are removed immediately; existing origin data is not enumerated or read.
- `network`: passive Network Information API and related network-interface availability checks. It does **not** perform speed tests, send probe traffic, discover IP addresses, create WebRTC peer connections, or probe local-network resources.
- `fonts`: controlled font availability estimates for a predefined list only, separated into platform-common, XR/vendor candidate, and generic CSS families. It uses `document.fonts.check()` when available or a temporary offscreen width fallback that is removed immediately and may produce false positives. It never calls `queryLocalFonts()` and never requests local-font permissions.
- `cssMedia`: fixed `window.matchMedia()` checks for color/appearance, motion/accessibility, input capability, display mode, scripting, and update media queries. These browser-exposed preferences and capabilities can reveal device, display, and accessibility characteristics; the collector does not attach persistent listeners.
- `featureDetection`: safe API/interface presence checks grouped by platform, graphics, media, XR, input, storage/execution, connectivity, device-access, file/clipboard, and security categories. It does not instantiate sensitive interfaces or invoke permission prompts.
- `gamepad`: one passive `navigator.getGamepads()` snapshot of static/coarse controller metadata only. It records IDs, mapping, counts, actuator metadata, and timestamp presence, but never records axes values, button state/value, pose, movement, orientation, repeated samples, or controller behavior.

Every collector returns a standard JSON object containing a category name, supported status, collected values, warnings, and errors.

## Project structure

```text
/
├── index.html
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── core/
│   │   └── app.js
│   ├── collectors/
│   │   ├── navigator.js
│   │   ├── screen.js
│   │   ├── window.js
│   │   ├── canvas.js
│   │   ├── webgl.js
│   │   ├── audio.js
│   │   ├── webgpu.js
│   │   ├── webxr.js
│   │   ├── permissions.js
│   │   ├── storage.js
│   │   ├── network.js
│   │   ├── fonts.js
│   │   ├── cssMedia.js
│   │   ├── featureDetection.js
│   │   └── gamepad.js
│   ├── export/
│   │   └── jsonExport.js
│   ├── ui/
│   │   └── renderer.js
│   └── utils/
│       └── utils.js
├── docs/
│   └── architecture.md
├── data/
│   └── samples/
└── tests/
```

## How to run locally

Because the app uses JavaScript modules, serve the repository with a static file server instead of opening the file directly:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`, click **Collect Fingerprint**, inspect the pretty JSON viewer, and use **Copy JSON** or **Download JSON** to export the result.

## Ethical note

This platform is for transparent, academic fingerprinting research. Canvas, WebGL, generated offline audio, passive WebGPU capability enumeration, passive WebXR capability enumeration, permission-state reads, storage capability checks, and coarse network capability reads are included because they are known browser fingerprinting surfaces, but the implementation avoids user input collection, permission prompts, media-device access, XR sessions, motion sensor data, pose data, eye tracking, hand tracking, controller movement, or environment-sensing streams. No motion sensor data is collected. No arbitrary font enumeration occurs, no sensitive device API is activated, no controller behavior is recorded, no third-party scripts are used, and collection remains local with no data upload. No fingerprint data is uploaded remotely; collection occurs locally in the browser, and users can inspect, copy, or download the resulting JSON. No protected resource is accessed merely because permission is granted. Any future research protocol should document consent, purpose limitation, and data minimization before adding new collectors.
