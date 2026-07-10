# XR Web Fingerprinting Research Platform

A foundation prototype for studying browser-exposed fingerprinting surfaces in XR/WebXR browsers and traditional desktop browsers.

This project is intended for academic browser measurement research. It does **not** collect user input, does **not** collect motion sensor data, and does **not** implement Permissions, Gamepad, Fonts, Storage, Network, CSS Media Queries, or broad feature-detection collectors in this task.

## Implemented modules

- `navigator`: passive Navigator API properties such as user agent, platform, languages, touch points, and hardware concurrency.
- `screen`: Screen API dimensions, color depth, pixel depth, and orientation metadata.
- `window`: viewport and window dimensions, device pixel ratio, offsets, and visual viewport metadata.
- `canvas`: deterministic offscreen 2D canvas rendering with hashed image and text outputs, dimensions, and 2D context metadata.
- `webgl`: WebGL/WebGL2 support, vendor and renderer strings, unmasked debug renderer information when available, extensions, major graphics limits, and shader precision values.
- `audio`: deterministic Web Audio API rendering with `OfflineAudioContext`, oscillator/compressor processing, sample statistics, and a hash of rendered samples. This module uses generated offline audio only; it does **not** access the microphone, call `getUserMedia`, enumerate media devices, or request audio permissions.
- `webgpu`: passive WebGPU capability enumeration, including support status, adapter features, adapter limits, adapter info when exposed by the browser, and warnings when WebGPU or adapter metadata is blocked or unavailable. This module does **not** request XR, camera, microphone, or motion-sensor permissions.
- `webxr`: passive WebXR capability enumeration, including secure-context status, `navigator.xr` availability, browser-exposed WebXR constructor/prototype availability, and `isSessionSupported()` results for `inline`, `immersive-vr`, and `immersive-ar`. This module does **not** call `requestSession()`, request immersive sessions, request XR permissions, or collect motion, pose, orientation, eye, hand, controller, camera passthrough, depth, hit-test, anchor, scene-understanding, or other behavioral/environment sensor streams. Some WebXR capabilities may be hidden until a site explicitly requests a session, so this module intentionally measures only passively exposed capabilities.

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
│   │   └── webxr.js
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

This platform is for transparent, academic fingerprinting research. Canvas, WebGL, generated offline audio, passive WebGPU capability enumeration, and passive WebXR capability enumeration are included because they are known browser fingerprinting surfaces, but the implementation avoids user input collection, permission prompts, media-device access, XR sessions, motion sensor data, pose data, eye tracking, hand tracking, controller movement, or environment-sensing streams. Any future research protocol should document consent, purpose limitation, and data minimization before adding new collectors.
