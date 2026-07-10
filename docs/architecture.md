# Architecture

## Application lifecycle

`index.html` loads a static dashboard and `js/core/app.js`. A user starts collection, the app disables duplicate collection buttons, runs the collector registry one module at a time, applies a 10 second timeout to each asynchronous collector, normalizes results, renders summaries, and enables local copy/download actions.

## Collector registry and schema

Collectors live in `js/collectors/` and return a standard envelope with `category`, `supported`, `values`, `warnings`, and `errors`. The application adds `durationMs` and `timedOut` for debugging. Failures are isolated so one collector cannot abort the full local collection result.

## Normalization and hashing

`js/utils/normalization.js` serializes special values, typed arrays, Maps, Sets, Error objects, and circular references with deterministic key ordering. `js/utils/hashing.js` uses Web Crypto SHA-256 when available and a clearly labeled non-cryptographic fallback otherwise. Hashes summarize observed values; they are not proof of uniqueness.

## UI, export, and comparison

`js/ui/renderer.js` renders summary cards, category navigation, structured values, raw JSON, and comparison tables. `js/ui/filters.js` filters flattened paths without mutating raw data. `js/ui/comparison.js` recursively compares JSON paths and excludes volatile metadata from similarity by default. `js/export/jsonExport.js` handles full, summary, and comparison downloads with sanitized filenames.

## Adding collectors

Add a module under `js/collectors/`, return the standard envelope, avoid permission prompts and sensitive APIs, add it to the registry in `js/core/app.js`, update docs and tests, and do not introduce network requests or third-party dependencies.
