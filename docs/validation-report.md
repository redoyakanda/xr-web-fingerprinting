# Phase E technical validation report

**Validation date:** 2026-09-14  
**Application version:** 1.2.0  
**Schema version:** 2.0.0

## Scope and modules validated

The repository was reviewed end to end: the navigator, screen, window, canvas, WebGL, WebGPU, audio, permissions, WebXR, gamepad, CSS media-query, fonts, storage, network, and general feature-detection collectors; all four accessibility collectors; experiment manager, recorder, aggregate extraction, fixed task environment, and focus/navigation categorization; accessibility summary and feature-vector analysis; dashboard rendering/filtering, JSON display, local comparison, and export.

No collector, research question, detector, or classifier was added.

## Findings and fixes

1. **Feature-vector label leakage:** the Feature Vector export duplicated researcher ground truth beside observed feature groups. It now exports feature groups only. Ground truth remains solely trial metadata in `interactionExperiment.groundTruth` and is never inferred.
2. **Summary label duplication:** the accessibility analysis summary duplicated ground truth among observed summaries. That duplicate was removed.
3. **Mutable state exposure:** `ExperimentManager.snapshot()` returned references to internal tasks and ground truth. A caller could therefore overwrite researcher labels or task definitions. Snapshots are now detached JSON-safe copies.
4. **Aggregate numeric edge cases:** undefined/non-finite/negative durations and interaction counts could yield `NaN`, negative timing, or non-JSON numeric values when aggregate extraction was called with partial inputs. Durations, counts, and focus intervals are now finite/non-negative; absent task durations remain `null`; empty ratios remain zero except the intentionally undefined keyboard-to-pointer ratio (`null` when keyboard activations exist without pointer activations).
5. **Comparison state clarity:** comparison rows now include a normalized `status` (`same`, `changed`, missing side, `unsupported`, or `not-performed`) and summaries count unsupported/not-performed fields. Existing result labels remain for backward-compatible rendering.
6. **Schema sanity checking:** a practical validator now checks required major sections, schema version, UTC timestamps, passive performance state, and the fixed no-classifier contract.
7. **False circular normalization:** the compatibility `collectors` alias and `passiveSnapshot.collectors` shared one object reference, so JSON normalization replaced the passive collector tree with a circular-reference marker. The passive tree is now detached before normalization, preserving both complete data trees and independent snapshots.
8. **Versioning:** application version advanced from 1.1.0 to 1.2.0. Schema version remains 2.0.0 because the existing record contract and field meanings did not change; fixes remove unintended duplication and add validation/comparison annotations.

## Passive snapshot and repeated trials

Passive collectors are held in one static manifest and invoked exactly once per explicit collection. There is no passive polling, collector-installed listener, or automatic collection startup. The only scheduling in the collection path is a UI-yielding animation frame between collectors and a per-collector timeout that is cleared on settlement. A new results object and collection ID are created each time; automated tests mutate one result and confirm the next is independent.

Reset clears the integrated interaction result and recorder buffers/listeners. Preparing another trial creates fresh fixed task states and copies researcher-entered ground truth. Automated lifecycle tests cover listener removal, stopped recording, buffer reset, and identical task IDs under screen-reader, no-screen-reader, keyboard-only, and pointer-only conditions. The fixed task definitions, rendered DOM, ordering, instructions, and expected targets contain no condition branch.

## Extension artifact observation

Observation is reachable only from the explicit button. Its default configured duration is 2,000 ms. At most one observer is active: starting another safely stops and disconnects the former. Completion and replacement both clear the timer, disconnect the `MutationObserver`, set `observerDisconnected: true`, and release the module-level active reference. Tests cover repeat execution and cleanup.

Only aggregate mutations, attribute names/counts, coarse page-visible element characteristics, custom-element names, CSS class names, and newly page-visible global property names are retained. The module does not enumerate installed extensions, construct or probe extension URLs/IDs, access extension storage, or make requests.

## Interaction lifecycle, cleanup, and performance

The lifecycle is `IDLE → READY → RECORDING → FINISHED` (with explicit cancellation as a terminal alternative). Preparing adds no recording listener; Start Experiment is the only route to recording. Finish and valid completion of the final UI task call the same finish path. No duration cutoff exists; 20-second, 60-second, and five-minute synthetic durations are covered.

Finish removes focus, keyboard, pointer activation, click, and throttled scroll listeners and cancels a pending scroll timer before aggregates are finalized. UI elapsed timers are also cleared. Post-finish events are ignored. No `pointermove` stream or exact trajectory is collected, scroll recording is throttled to at most one coarse sample per 100 ms, and there is no high-frequency sensor sampling or observer left active.

## Privacy audit

Keyboard events retain only allowlisted navigation/activation categories; all other single-character keys become `text-input-key`. Event records never read `value`, text content, passwords, textarea/contenteditable contents, search strings, usernames, email addresses, or clipboard data. Pointer records omit coordinates and trajectories. Raw event export defaults off and requires explicit researcher configuration; even then it uses the same content-safe event representation. Default complete and subset exports contain no raw trace.

Static and manual code review found no access to accelerometer, gyroscope, magnetometer, device-motion/orientation streams, XR poses, head/hand/controller motion, eye tracking/gaze, passthrough/depth imagery, microphone audio, or camera video. WebXR checks capability/session support without requesting an XR session. Audio fingerprinting uses an offline audio context and does not access a microphone.

## Unsupported browsers and failure handling

Collectors use normalized envelopes with `supported`, `values`, `warnings`, `errors`, and duration. Missing WebXR, WebGPU, Gamepad, Permissions, Network Information, CSS media-query support, ElementInternals/ARIA reflection, VirtualKeyboard, and InputDeviceCapabilities are tested or guarded and do not abort the sequence. A collector exception or ten-second timeout becomes a structured, continued error. `supported: false`, `performed: false`, structured error, and `null` scalar states retain distinct meanings and the final object remains serializable.

Known limitation: browser-exposed capability surfaces vary substantially and privacy protections may reduce values. Absence of a signal is not evidence of assistive-technology use. Manual validation is still required on actual NVDA, JAWS, Narrator, VoiceOver, TalkBack, and Quest configurations because those environments are unavailable to the automated Node suite.

## Feature groups and schema

All eight required groups are present: device/browser, traditional fingerprint, XR, accessibility preference, accessibility environment, accessibility API surface, extension artifact, and interaction. Ground truth is excluded. Some source collector values appear both in the compatibility `collectors` alias and in `passiveSnapshot.collectors`, and selected values are projected into feature groups; this intentional duplication preserves Phase A–C imports and supplies analysis-oriented grouping. It is documented in `docs/data-schema.md`.

UTC wall-clock timestamps use ISO strings; durations/intervals use milliseconds. The schema validator verifies the canonical major sections and classifier invariant. The platform permanently reports `screenReaderDetectionModelStatus: "not-trained"` and `classification: null`.

## Network audit

Application source contains no `fetch()` invocation, XMLHttpRequest construction, WebSocket construction, beacon, telemetry, analytics, logging, upload, or remote comparison path. Network-related collectors perform capability inspection only. HTML loads CSS and JavaScript from same-origin relative paths, with no remote fonts, scripts, images, or dependencies. Exports use an in-memory Blob/object URL and comparisons parse local user-selected files. **No research data is transmitted remotely.** Deploying the static site itself naturally requires ordinary requests for its local HTML/CSS/JS assets.

## Website accessibility review

The page uses headings and landmark regions, native labelled controls, keyboard-operable buttons/forms, live status output, native dialog semantics, visible focus styling, and a reduced-motion media rule. The standardized task environment includes headings, navigation, main content, a skip link, fieldset/legend form grouping, table caption/headers, complementary landmark, tabs, and live feedback. There are no hover-only experiment controls. Device/AT checklist validation remains mandatory before pilot enrollment.

## Remaining pilot TODOs

- Execute every configuration in `docs/testing.md` on physical browsers/devices and record browser versions.
- Verify native dialog focus behavior in each older target browser; native implementations differ.
- Confirm WebGPU/WebXR availability and secure-context policy on the actual deployment origin.
- Monitor warnings and memory during unusually long real trials; no arbitrary trial cutoff is intentionally imposed.
- Treat all accessibility signals as measurements only. Do not interpret similarity as entropy/uniqueness or claim screen-reader detection.
