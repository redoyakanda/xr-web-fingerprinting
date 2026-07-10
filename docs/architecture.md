# Architecture

The project is a static browser application organized around small ES modules. The runtime starts at `js/core/app.js`, collects browser-exposed values, renders a pretty JSON view, and exports the result without requiring a backend.

## Core controller

`js/core/app.js` owns application flow. It wires button events, calls enabled collectors, adds collection metadata, and merges results into one final fingerprint object with top-level keys for `navigator`, `screen`, `window`, `canvas`, and `webgl`.

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

Collectors should avoid permission prompts, user input collection, motion sensors, and unrelated fingerprinting surfaces unless explicitly added by a future task.

## UI renderer

`js/ui/renderer.js` updates the status panel, module summary, timestamp, and pretty JSON viewer. Keeping rendering separate from collection makes collector modules easier to test and extend.

## JSON export module

`js/export/jsonExport.js` centralizes JSON formatting, clipboard copy, and local download behavior. The rest of the application passes complete fingerprint objects into this module instead of duplicating serialization logic.

## Shared utilities

`js/utils/utils.js` contains cross-cutting helpers such as safe property reads, timestamp creation, collector envelope creation, array normalization, and SHA-256 hashing.

## Adding a new collector

1. Create a new file in `js/collectors/`, for example `example.js`.
2. Export a function that returns the standard collector envelope.
3. Keep collection deterministic, serializable, and side-effect-minimized.
4. Import the new collector in `js/core/app.js`.
5. Add the module name to the `modules` array and merge the result into the final fingerprint object.
6. Update `README.md`, this architecture document, and the status panel in `index.html`.
7. Add tests or sample data when a test harness is available.
