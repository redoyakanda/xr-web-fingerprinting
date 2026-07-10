# Architecture

The project is a static browser application organized around small ES modules. The runtime starts at `js/core/app.js`, collects browser-exposed values, renders a pretty JSON view, and exports the result without requiring a backend.

## Core controller

`js/core/app.js` owns application flow. It wires button events, calls enabled collectors, adds collection metadata, and merges results into one final fingerprint object with top-level keys for `navigator`, `screen`, `window`, `canvas`, `webgl`, `audio`, and `webgpu`.

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

Collectors should avoid permission prompts, user input collection, motion sensors, and unrelated fingerprinting surfaces unless explicitly added by a future task.

## Asynchronous collectors

Collectors may be synchronous or asynchronous. For example, `canvas.js` and `audio.js` hash deterministic output with the asynchronous Web Crypto API, while `webgpu.js` awaits `navigator.gpu.requestAdapter()` and optional adapter info APIs. `js/core/app.js` always awaits every collector through `Promise.all()`, so adding an async collector does not require special UI or export handling.

A collector should still catch API-specific errors internally when it can add useful warnings or fallback values. The core `runCollector()` wrapper is the final safety net for unexpected failures and returns `{ category, supported, values, warnings, errors }` for every module.

## UI renderer

`js/ui/renderer.js` updates the status panel, module summary, timestamp, and pretty JSON viewer. Keeping rendering separate from collection makes collector modules easier to test and extend. Because the pretty JSON viewer renders the complete fingerprint object, new collector top-level keys appear automatically once `app.js` includes them.

## JSON export module

`js/export/jsonExport.js` centralizes JSON formatting, clipboard copy, and local download behavior. The rest of the application passes complete fingerprint objects into this module instead of duplicating serialization logic.

## Shared utilities

`js/utils/utils.js` contains cross-cutting helpers such as safe property reads, timestamp creation, collector envelope creation, array normalization, and SHA-256 hashing.

## Adding a new collector

1. Create a new file in `js/collectors/`, for example `example.js`.
2. Export a function that returns the standard collector envelope.
3. Keep collection deterministic, serializable, and side-effect-minimized.
4. Import the new collector in `js/core/app.js`.
5. Add the module name and function to the `collectors` array; metadata and result merging are derived from that registry.
6. Update `README.md`, this architecture document, and visible module lists in `index.html` as needed.
7. Add tests or sample data when a test harness is available.
