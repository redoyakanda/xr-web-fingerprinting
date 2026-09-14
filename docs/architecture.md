# Architecture

## Application lifecycle

`index.html` loads a static dashboard and `js/core/app.js`. A user starts collection, the app disables duplicate collection buttons, runs the collector registry one module at a time, applies a 10 second timeout to each asynchronous collector, normalizes results, renders summaries, and enables local copy/download actions. Every collector runs once per button click; there are no observers, polling loops, or continuous accessibility/interaction monitors.

## Collector registry and schema

Collectors live in `js/collectors/` and return a standard envelope with `category`, `supported`, `values`, `warnings`, and `errors`. The application adds `durationMs` and `timedOut` for debugging. Failures are isolated so one collector cannot abort the full local collection result.

Three collectors provide the first accessibility-related measurement phase:

- `accessibilityPreferences.js` snapshots CSS media preferences, pixel ratio, and `visualViewport` characteristics.
- `accessibilityEnvironment.js` snapshots the current focus target and passively exposed DOM/environment capabilities. It explicitly reports that direct screen-reader detection is unavailable.
- `accessibilityAPISurface.js` safely checks API/property presence and groups it into ARIA reflection, focus navigation, semantic controls, accessibility CSS, input modality, and browser accessibility APIs. It does not construct or activate sensitive interfaces.

These separate JSON feature groups describe accessibility-related browser state only. A preference, reflected ARIA property, focus state, or available API is not evidence that a screen reader is running and does not support an inference about disability status. Mainstream web browsers do not expose a general `navigator.screenReader` API. No screen-reader detector, heuristic rules, machine-learning model, interaction recorder, accessibility-tree access, or extension observer exists in this phase. Top-level model fields remain `screenReaderDetectionModelStatus: "not-trained"` and `classification: null`.

## Normalization and hashing

`js/utils/normalization.js` serializes special values, typed arrays, Maps, Sets, Error objects, and circular references with deterministic key ordering. `js/utils/hashing.js` uses Web Crypto SHA-256 when available and a clearly labeled non-cryptographic fallback otherwise. Hashes summarize observed values; they are not proof of uniqueness.

## UI, export, and comparison

`js/ui/renderer.js` renders summary cards, category navigation, structured values, raw JSON, and comparison tables. `js/ui/filters.js` filters flattened paths without mutating raw data. `js/ui/comparison.js` recursively compares JSON paths and excludes volatile metadata from similarity by default. `js/export/jsonExport.js` handles full, summary, and comparison downloads with sanitized filenames.

The application is entirely local: no collector uploads data, calls a backend, or emits analytics. Accessibility collection excludes motion-sensor values, camera, microphone, geolocation, XR pose, screen-reader speech, typed text, and extension enumeration.

## Adding collectors

Add a module under `js/collectors/`, return the standard envelope, avoid permission prompts and sensitive APIs, add it to the registry in `js/core/app.js`, update docs and tests, and do not introduce network requests or third-party dependencies.
