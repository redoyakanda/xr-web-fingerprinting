# Testing and pilot checklist

## Automated validation

Run `npm test` before a pilot. The suite covers schema/export serialization, unsupported APIs, repeated independent passive snapshots, bounded extension observation and observer disconnection, interaction lifecycle and cleanup, task invariance, ground-truth isolation, privacy-safe key categorization, aggregate edge cases, comparison semantics, and the no-classifier contract.

## Checklist used for every manual configuration

For **each** configuration below:

- [ ] Start from **Reset** without reloading the page; confirm task state, elapsed time, and prior feature buffers are clear.
- [ ] Complete the listed collection/experiment actions using the stated input method.
- [ ] Export the Complete Research Record and each relevant focused export; parse each as JSON locally.
- [ ] Inspect warnings and unsupported states; confirm unsupported is distinct from not performed and does not stop the application.
- [ ] Finish/cancel and verify elapsed displays stop, no later input changes event/aggregate counts, and extension observation reports `observerDisconnected: true`.
- [ ] Confirm exports contain no typed characters, form values, clipboard data, pointer coordinates/trajectories, passwords, usernames, or email addresses.
- [ ] Confirm there are no console-breaking errors and no research-data requests in the browser Network panel.
- [ ] Check headings, landmarks, labels, focus visibility/order, keyboard operation, live status announcements, dialog focus/closing, contrast, zoom/reflow, and reduced-motion behavior.

## Browser and assistive-technology matrix

### Desktop Chrome
- [ ] Passive snapshot.
- [ ] Two-second extension artifact observation.
- [ ] Pointer experiment.
- [ ] Keyboard-only experiment.
- [ ] Repeat three trials without reload: P001 / SR OFF, Reset; P001 / SR ON, Reset; P001 / keyboard-only.

### Windows + NVDA
- [ ] Passive snapshot.
- [ ] Screen-reader interaction experiment and all common checks.

### Windows + Narrator
- [ ] Screen-reader interaction experiment and all common checks.

### Windows + JAWS (if available)
- [ ] Screen-reader interaction experiment and all common checks.

### macOS + VoiceOver
- [ ] Screen-reader interaction experiment and all common checks.

### Android + TalkBack
- [ ] Screen-reader interaction experiment and all common checks.

### iPhone + VoiceOver
- [ ] Screen-reader interaction experiment and all common checks.

### Meta Quest Browser
- [ ] Passive fingerprint.
- [ ] Verify the WebXR collector reports capability/permission surface only and does not request a session or pose.
- [ ] Verify unsupported accessibility modules return warnings and the rest of collection continues.

## Comparison and export scenarios

- [ ] Compare identical records, SR ON versus SR OFF, keyboard-only versus SR, mobile versus desktop, and XR versus desktop.
- [ ] Confirm same, changed, missing, unsupported, and not-performed statuses are distinguishable.
- [ ] Confirm volatile timestamps/IDs are excluded from default fingerprint equality, while behavioral timing remains in interaction-feature mode.
- [ ] Confirm the UI describes similarity only as field equality—not uniqueness or entropy.
- [ ] Exercise Complete Research Record, Passive Snapshot Only, Traditional Fingerprinting Features, XR Features, Accessibility Passive Features, Extension Artifact Features, Interaction Aggregate Features, Feature Vector, and Comparison Report exports.
- [ ] Confirm filenames are sanitized, identify participants only by code, and all files are generated locally.
