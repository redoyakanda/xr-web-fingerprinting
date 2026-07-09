# XR Web Fingerprinting Research Platform

A foundation prototype for studying browser-exposed fingerprinting surfaces in XR/WebXR browsers and traditional desktop browsers.

The project is intentionally limited to passive, non-sensor browser properties for this initial milestone. It does **not** collect motion sensor data and does **not** include WebGL, Canvas, Audio, WebXR, Permissions, Gamepad, Fonts, Storage, or Network modules.

## Implemented modules

- `navigator`: passive Navigator API properties such as user agent, platform, languages, touch points, and hardware concurrency.
- `screen`: Screen API dimensions, color depth, pixel depth, and orientation metadata.
- `window`: viewport and window dimensions, device pixel ratio, offsets, and visual viewport metadata.

## Project structure

```text
/
├── index.html
├── style.css
├── app.js
├── README.md
└── js/
    ├── navigator.js
    ├── screen.js
    ├── window.js
    └── utils.js
```

## Usage

Open `index.html` in a browser or serve the repository with a static file server. Click **Collect Fingerprint** to merge the enabled module outputs into a single JSON object, then use **Copy JSON** or **Download JSON** to export the result.

For local development with Python installed:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Extension notes

Each collector module should return a serializable JSON object and avoid side effects, permission prompts, or active device access unless a future research protocol explicitly requires it. Add future collectors as separate modules and merge them in `app.js` under a new top-level key.
