# XR Web Fingerprinting Research Platform

A static, vanilla JavaScript research prototype for observing browser-exposed fingerprinting features in desktop and XR browsers. All collection, export, import, filtering, and comparison occur locally in the browser; the page has no backend, analytics, CDN dependencies, or automatic data submission.

## Research scope

The platform records a passive local collection result across the existing navigator, screen, window, canvas, WebGL, audio, WebGPU, WebXR, permissions, storage, network, fonts, CSS media-query, feature-detection, and gamepad collectors. It also records three separate accessibility-related groups: **Accessibility Preferences**, **Accessibility Environment**, and **Accessibility API Surface**.

The accessibility collectors take a one-time snapshot only when **Collect Passive Fingerprint** is selected. They inspect browser-exposed media preferences, focus/environment state, and API availability. They do not continuously monitor interactions, access an operating-system accessibility tree, read screen-reader output, collect typed text, enumerate extensions, or activate sensitive APIs. Accessibility-related browser state can vary during screen-reader-assisted browsing or assistive-technology-assisted interaction, but these signals are **not proof of screen-reader use and must not be used to infer disability status**. Mainstream browsers expose no general `navigator.screenReader` API, and this project has no heuristic detector or classifier; exported results explicitly report `screenReaderDetectionModelStatus: "not-trained"` and `classification: null`.

## Project structure

- `index.html` – static dashboard shell.
- `css/style.css` – responsive, accessible dashboard styling.
- `js/core/app.js` – application lifecycle, collector orchestration, timeouts, and UI events.
- `js/collectors/` – passive collector modules.
- `js/ui/` – rendering, summaries, filtering, and comparison.
- `js/export/jsonExport.js` – copy/download helpers.
- `js/utils/` – normalization, stable serialization, and hashing helpers.
- `docs/` – architecture, methodology, schema, testing, and ethics notes.
- `tests/` – development-time Node tests for static modules.

## Local development

No build step is required. Serve the repository with any static server so browser module imports work:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. Development tests can be run with Node:

```bash
node tests/schema.test.js
node tests/normalization.test.js
node tests/comparison.test.js
```

Node is only used for tests; the deployed webpage remains fully static.

## GitHub Pages deployment

Enable Pages for the repository branch and root directory. Because the artifact uses relative paths and no server APIs, it can be hosted directly by GitHub Pages or any static file server.

## Testing on XR browsers

Host over HTTPS or `localhost`, open the URL in the target XR browser, collect a fingerprint, export JSON, then repeat under the protocols in `docs/methodology.md`. Suggested targets include Meta Quest Browser, Apple Vision Pro Safari, Pico Browser, and desktop Chrome/Edge/Firefox/Safari.

## Exporting and comparison

Use **Download JSON** for a full local result or **Download Summary** for metadata and per-collector status only. Use **Import JSON for Comparison** to compare the current result against another JSON file locally. Similarity is documented as identical comparable fields divided by total comparable fields, excludes volatile metadata by default, and is not an entropy or uniqueness metric.

## Privacy and ethics

The project is a research prototype. It avoids remote upload, third-party scripts, analytics, hidden identifiers, automatic persistent storage, camera, microphone, geolocation, motion-sensor values, XR pose, screen-reader speech, typed text, extension enumeration, and WebRTC IP discovery. Obtain appropriate consent and IRB/ethics review before collecting data from human participants.

## Current limitations and compatibility

Unsupported APIs are reported as unsupported or partial results. WebXR/WebGPU often require HTTPS, flags, hardware support, or browser-specific enablement. Permission states may be unavailable or inconsistent. The observed feature vector should not be treated as a unique or permanent device identifier.

## Contributing

Keep the app static and dependency-free. Do not add sensitive collectors or permission prompts without documented ethics review. Update docs and tests whenever schemas or UI behavior change.

## Phase B: bounded extension artifacts

The separate **Extension Artifacts** control explicitly starts a two-second observation of page-visible DOM changes and new JavaScript global property names. It never runs at page load or during passive collection. It does not enumerate installed extensions, probe extension URLs or IDs, or inspect extension internals. Its aggregate `extensionArtifactObservation` output and `extensionArtifactFeatures` family remain separate from the passive snapshot. Observed mutations are not evidence of assistive-technology or screen-reader use.

## Phase C: accessibility interaction experiment

The dashboard now includes an optional, controlled **Accessibility Interaction Experiment**. A researcher supplies pseudonymous ground-truth condition labels, the participant confirms the notice, and recording begins only when Start is activated. The identical ten-task accessible environment is used for every comparison condition. Finish or Cancel immediately removes interaction listeners; Reset supports uncontaminated repeated trials.

The exported `interactionExperiment` is separate from passive collection and extension-artifact observation. It contains task summaries and candidate aggregate features, with raw events disabled by default. This is a local measurement system, **not a screen-reader detector**: no disability inference, classification, automatic upload, typed content, values, pointer trajectories, or sensor/pose data is collected. Application version 1.0.0 uses schema 1.3.0.
