# Data schema

## Top-level metadata

The fingerprint object includes `schemaVersion`, `applicationVersion`, `collectionId`, `collectedAtUTC`, `collectionDurationMs`, `collectionStatus`, `secureContext`, `pageURLOrigin`, collector counts, warning/error counts, `totalValuesCollected`, `ethicsNotice`, `collectorManifest`, `categorySummaries`, and `collectors`.

`pageURLOrigin` stores only the origin, not query strings or fragments. Referrer URL is not collected.

## Collector schema

Each collector entry contains `category`, `supported`, `values`, `warnings`, `errors`, `durationMs`, and `timedOut`. Unsupported APIs should return a valid envelope with explanatory warnings rather than throwing.

## Warnings, errors, and nulls

Warnings are non-fatal strings. Errors are structured with collector name, message, type, stage, and whether collection continued. Stack traces are excluded unless debug mode is enabled locally. `null` means unavailable, inapplicable, or intentionally absent as documented by the collector.

## Versioning policy

Schema version `1.2.0` is used for this research-grade static schema. Increment the schema when field meaning or required structure changes.

## Comparison report schema

Reports include comparison timestamp, sanitized source filenames, summary counts, excluded volatile path patterns, and field-level differences. Raw local file paths are never included.

## Phase B sections

`passiveSnapshot`, `extensionArtifactObservation`, and the reserved `interactionExperiment` are separate top-level sections. The extension section records whether the explicit observation was performed, timestamps, duration, cleanup state, configured duration, and compact `aggregateFeatures`. It is never merged into passive collector values. `js/ui/featureVector.js` exposes those aggregates as `extensionArtifactFeatures`.
