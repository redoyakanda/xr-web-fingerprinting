# Data schema

## Top-level metadata

The fingerprint object includes `schemaVersion`, `applicationVersion`, `collectionId`, `collectedAtUTC`, `collectionDurationMs`, `collectionStatus`, `secureContext`, `pageURLOrigin`, collector counts, warning/error counts, `totalValuesCollected`, `ethicsNotice`, `collectorManifest`, `categorySummaries`, and `collectors`.

`pageURLOrigin` stores only the origin, not query strings or fragments. Referrer URL is not collected.

## Collector schema

Each collector entry contains `category`, `supported`, `values`, `warnings`, `errors`, `durationMs`, and `timedOut`. Unsupported APIs should return a valid envelope with explanatory warnings rather than throwing.

## Warnings, errors, and nulls

Warnings are non-fatal strings. Errors are structured with collector name, message, type, stage, and whether collection continued. Stack traces are excluded unless debug mode is enabled locally. `null` means unavailable, inapplicable, or intentionally absent as documented by the collector.

## Versioning policy

Schema version `2.0.0` is used for the unified Phase D research record. Increment the schema when field meaning or required structure changes.

## Comparison report schema

Reports include comparison timestamp, sanitized source filenames, summary counts, excluded volatile path patterns, and field-level differences. Raw local file paths are never included.

## Phase B sections

`passiveSnapshot`, `extensionArtifactObservation`, and the reserved `interactionExperiment` are separate top-level sections. The extension section records whether the explicit observation was performed, timestamps, duration, cleanup state, configured duration, and compact `aggregateFeatures`. It is never merged into passive collector values. `js/ui/featureVector.js` exposes those aggregates as `extensionArtifactFeatures`.

## `interactionExperiment` (schema 1.3.0)

`performed` is false until a completed trial is integrated. A completed object contains researcher-provided `groundTruth` (`assistiveTechnologyCondition`, `screenReader`, `deviceClass`, `browserConditionLabel`, pseudonymous `participantCode`, `trialNumber`, `sessionNumber`, and optional notes), `state: "finished"`, and `timing` with ISO start/finish values and observed `durationMs`.

`tasks` contains the fixed task ID/type, expected controlled target, timestamps, duration, completion flag, and interaction count. `aggregateFeatures` groups timing, focus/navigation, keyboard navigation, pointer usage, semantic traversal, coarse scrolling, and task performance. These are candidate measurements, not classifications. `rawEventsIncluded` is false by default; therefore normal exports omit the complete event stream. Debug export requires explicit programmatic opt-in and remains content-safe and local.

## Unified schema 2.0.0

The canonical record is JSON serializable and contains:

- `metadata`: `schemaVersion`, `applicationVersion`, `collectionId`, `collectedAtUTC`, `secureContext`, and origin-only page context.
- `passiveSnapshot`: `performed`, start/finish/duration timing, and normalized collector envelopes.
- `extensionArtifactObservation`: `performed`, bounded/configured timing, `observerDisconnected`, warnings/errors, and aggregates. False means not performed; an unavailable observer is represented as unsupported rather than completed.
- `interactionExperiment`: `performed`, manual `groundTruth`, start/finish/duration timing, stable task summaries, aggregate features, and `rawEventsIncluded: false` by default. Cancellation is distinct from completion.
- `featureGroups`: `deviceBrowserFeatures`, `traditionalFingerprintFeatures`, `xrFeatures`, `accessibilityPreferenceFeatures`, `accessibilityEnvironmentFeatures`, `accessibilityAPISurfaceFeatures`, `extensionArtifactFeatures`, and `interactionFeatures`.
- `accessibilitySummary`: `screenReaderDetectionModelStatus: "not-trained"` and `classification: null`.

`null` represents an unavailable/not-applicable scalar; `supported: false` represents absent API capability; structured `errors` represent attempted operations that failed; `performed: false` means the temporal phase did not run. Top-level metadata aliases and `collectors` are retained for compatibility with Phase A-C exports. Research-condition labels live only under interaction `groundTruth` and are never automatically derived.

Selectable exports include the complete record, passive snapshot, traditional, XR, combined passive-accessibility, extension, interaction aggregate, and full feature-vector payloads. Comparison reports are the ninth export. Filenames use `xr-web-study_<UTC>_<collectionID>.json` (with a category prefix for subset exports) and never incorporate participant fields.
