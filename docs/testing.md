# Testing

## Local test procedure

Serve the app statically, collect a fingerprint, verify summary cards, structured/raw views, filters, copy actions, downloads, JSON import, and comparison reports. Run development tests with Node for schema, normalization, comparison, and export helpers.

## Browser targets

Test desktop Chrome, Edge, Firefox, and Safari where available. Test XR browsers such as Meta Quest Browser, Apple Vision Pro Safari, and Pico Browser over HTTPS or localhost.

## Unsupported-browser behavior

Disable or use browsers lacking WebXR, WebGPU, Permissions API, Network Information API, and Gamepad API. The app should still produce a valid partial result with unsupported collectors and warnings.

## Secure-context requirement

WebXR, WebGPU, clipboard, and some storage APIs may require HTTPS. GitHub Pages satisfies this requirement for deployment.

## Expected limitations

Browser privacy settings, private browsing, feature flags, GPU process state, and hardware availability can change values. No uniqueness or entropy claims are made.

## Phase D automated validation

`npm test` covers one-shot passive record construction and serialization, unsupported collector envelopes, explicit/bounded extension observation and disconnection, experiment activation/state transitions, recording boundaries, cleanup/reset and repeated-trial isolation, content-safe interaction events, local export selection, volatile comparison handling, and feature-family comparison. Static privacy checks should also search for prohibited capture and transmission primitives; apparent matches in documentation and tests must be reviewed rather than treated as runtime collection.

## Pilot manual checklist

For every row, verify the downloaded JSON parses, researcher-entered ground truth is correct, raw typed text is absent, `rawEventsIncluded` is false, no recorder/observer remains active, and no console-breaking error occurs.

- [ ] Desktop Chrome — collect passive fingerprint.
- [ ] Desktop Chrome — run the bounded extension observation and confirm **Observation Stopped**.
- [ ] Desktop Chrome — run the identical interaction experiment with a mouse.
- [ ] Desktop Chrome — run the identical interaction experiment keyboard-only.
- [ ] Desktop + NVDA — run the identical interaction experiment.
- [ ] Desktop + JAWS — run the identical experiment where available.
- [ ] Windows + Narrator — run the identical experiment.
- [ ] macOS + VoiceOver — run the identical experiment.
- [ ] Android + TalkBack — run the identical experiment.
- [ ] iPhone + VoiceOver — run the identical experiment.
- [ ] Meta Quest Browser — collect passive fingerprint.
- [ ] XR browser — verify unsupported accessibility components fail gracefully.
- [ ] Without refresh, reset P001 / Trial 1 / SR OFF, then run P001 / Trial 2 / SR ON; confirm isolation.
- [ ] Load two saved records and exercise every comparison family, including behavioral timing.
- [ ] Exercise every local export category and confirm no network request contains a record.

Physical assistive-technology/browser combinations remain a manual pilot prerequisite; automated DOM tests cannot establish real NVDA, JAWS, Narrator, VoiceOver, TalkBack, or XR-browser interoperability.
