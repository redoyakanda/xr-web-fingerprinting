# Architecture

## Application lifecycle

`index.html` loads a static dashboard and `js/core/app.js`. A user starts collection, the app disables duplicate collection buttons, runs the collector registry one module at a time, applies a 10 second timeout to each asynchronous collector, normalizes results, renders summaries, and enables local copy/download actions. Every collector runs once per button click; there are no observers, polling loops, or continuous accessibility/interaction monitors.

## Collector registry and schema

Collectors live in `js/collectors/` and return a standard envelope with `category`, `supported`, `values`, `warnings`, and `errors`. The application adds `durationMs` and `timedOut` for debugging. Failures are isolated so one collector cannot abort the full local collection result.

Three collectors provide the first accessibility-related measurement phase:

- `accessibilityPreferences.js` snapshots CSS media preferences, pixel ratio, and `visualViewport` characteristics.
- `accessibilityEnvironment.js` snapshots the current focus target and passively exposed DOM/environment capabilities. It explicitly reports that direct screen-reader detection is unavailable.
- `accessibilityAPISurface.js` safely checks API/property presence and groups it into ARIA reflection, focus navigation, semantic controls, accessibility CSS, input modality, and browser accessibility APIs. It does not construct or activate sensitive interfaces.

These separate JSON feature groups describe accessibility-related browser state only. A preference, reflected ARIA property, focus state, or available API is not evidence that a screen reader is running and does not support an inference about disability status. Mainstream web browsers do not expose a general `navigator.screenReader` API. The optional interaction recorder and bounded extension observer are separate explicit phases; no screen-reader detector, heuristic rules, machine-learning model, or accessibility-tree access exists. Top-level model fields remain `screenReaderDetectionModelStatus: "not-trained"` and `classification: null`.

## Normalization and hashing

`js/utils/normalization.js` serializes special values, typed arrays, Maps, Sets, Error objects, and circular references with deterministic key ordering. `js/utils/hashing.js` uses Web Crypto SHA-256 when available and a clearly labeled non-cryptographic fallback otherwise. Hashes summarize observed values; they are not proof of uniqueness.

## UI, export, and comparison

`js/ui/renderer.js` renders summary cards, category navigation, structured values, raw JSON, and comparison tables. `js/ui/filters.js` filters flattened paths without mutating raw data. `js/ui/comparison.js` recursively compares JSON paths and excludes volatile metadata from similarity by default. `js/export/jsonExport.js` handles full, summary, and comparison downloads with sanitized filenames.

The application is entirely local: no collector uploads data, calls a backend, or emits analytics. Accessibility collection excludes motion-sensor values, camera, microphone, geolocation, XR pose, screen-reader speech, typed text, and extension enumeration.

## Adding collectors

Add a module under `js/collectors/`, return the standard envelope, avoid permission prompts and sensitive APIs, add it to the registry in `js/core/app.js`, update docs and tests, and do not introduce network requests or third-party dependencies.

## Phase B bounded observer

The Phase B extension-artifact module is deliberately absent from the passive registry. Only its explicit button creates one `MutationObserver` over the current document, using child-list and attribute observation with `characterData: false`. The app excludes its own progress panel, disconnects after two seconds, and retains aggregate counts and names—not DOM, page text, script bodies, or stylesheet bodies. Starting another run stops the prior observer. Its top-level output and `extensionArtifactFeatures` family are separate from passive features and the reserved interaction experiment. This is neither extension enumeration nor a screen-reader detector.

## Phase C experiment components

`ExperimentManager` owns the `IDLE → READY → RECORDING → FINISHED` state machine (with cancellation), immutable researcher ground truth, fixed task ordering/timestamps, and final output. It prevents simultaneous trials. `experimentTasks` defines and renders the same semantic environment for every condition. `InteractionRecorder` independently follows `IDLE → READY → RECORDING → FINISHED`; only RECORDING handlers accept events. Finish, Cancel, and Reset synchronously unregister focus, keyboard, pointer, click, and throttled-scroll handlers and cancel pending timers. Reset also clears buffers.

After listener cleanup, `interactionFeatures` reduces safe event metadata into aggregate feature families. The analysis feature vector keeps these `interactionFeatures` separate from passive, extension-artifact, device/browser, traditional, XR, and accessibility families. The accessibility summary explicitly reports model status `not-trained` and a null classification.

## Phase D integrated record lifecycle

Phase D retains the Phase A-C collectors and gives them one research-record boundary. `metadata` holds standardized record identity/version/context. `passiveSnapshot`, `extensionArtifactObservation`, and `interactionExperiment` have independent `performed` and timing semantics. The passive snapshot runs its registry once; it never starts either bounded mode. Extension observation requires its own control and disconnects after 2000 ms. Interaction recording requires notice confirmation and Start, has no countdown or fixed cutoff, and stops at Finish, valid last-task completion, Cancel, or Reset.

`featureGroups` is regenerated whenever a completed optional phase is integrated. Families are independently exportable for future ablation. Traditional and device/browser families deliberately avoid duplication: network belongs to device/browser; permissions, CSS media, and generic feature detection belong to traditional; gamepad is grouped with XR because this platform records availability/static metadata only. Accessibility preference, environment, API, extension, and interaction families stay distinct. Compatibility top-level aliases remain for Phase A-C import tooling; canonical research metadata is `metadata`.

The dashboard is a static ES-module application. Blob downloads, clipboard copy, and `File.text()` imports are local browser operations. There is no fetch/XHR/WebSocket submission path, service, backend, analytics SDK, or remote asset dependency.
