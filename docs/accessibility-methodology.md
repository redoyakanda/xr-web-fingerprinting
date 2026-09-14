# Accessibility measurement methodology

## Phase B: page-visible extension artifacts

Browsers generally do not expose a general installed-extension enumeration API to ordinary webpages. Phase B asks only whether an accessibility-related extension can leave artifacts visible through ordinary page APIs. It does not identify installed add-ons, probe `chrome-extension://` or `moz-extension://` resources, scan extension IDs, fetch manifests, use network/timing probes, or inspect extension storage or internals.

The user must explicitly select **Observe Extension Artifacts**. The module takes lightweight element counts and global own-property names, starts one conservatively configured `MutationObserver`, and stops automatically after the default two-second (2000 ms) window. It watches the current document for child-list and attribute changes with `characterData: false`, and disconnects before returning a compact aggregate. It never retains a DOM snapshot, page or typed text, script or stylesheet content, passwords, clipboard contents, or sensor data.

Artifacts do **not** prove screen-reader use or disability status. An accessibility extension may be installed but inactive; a non-accessibility extension or the page itself may make the same changes. False positives and false negatives are expected and require experimental evaluation. There is no detector or classifier: `screenReaderDetectionModelStatus` remains `"not-trained"` and `classification` remains `null`.

The intended controlled comparison is **Extension OFF** versus **Extension ON** under identical browser, device, page, and task conditions. Results stay local unless manually downloaded. There is no backend, upload, analytics, remote logging, or third-party script.

## Phase C task-bounded interaction methodology

Phase C compares researcher-labelled SR ON and SR OFF trials and the keyboard-only, pointer-only, and accessibility-preference controls using one fixed ten-task sequence. Labels are manual ground truth and are never inferred or overwritten. Participant codes must be pseudonymous.

Recording starts only after the participant notice is confirmed and the Start control is activated. It ends on explicit task completion and Finish (or Cancel), when every listener and pending scroll timer is removed. **Experiment duration is a measured outcome. It is not the stopping condition.** There is no 30-, 60-, 120-second, or other time cutoff; natural 20-second, one-minute, and multi-minute trials follow identical lifecycle rules.

Focus semantics, navigation-key categories, coarse activations, and throttled coarse scrolling become task summaries and aggregate candidate features only after completion. Raw-event export is disabled by default. Characters, passwords, form values, editable content, pointer coordinates/trajectories, speech, and sensors are excluded even from internal event metadata.

No detector or classifier is trained or run. Keyboard-only behavior may resemble screen-reader behavior, so false positives must be tested explicitly. Interaction also differs among NVDA, JAWS, Narrator, VoiceOver, TalkBack, Orca, browsers, devices, and platforms; candidate signals must not be treated as evidence of disability.

## Phase D controls, ground truth, and future analysis

SR ON/OFF, named screen reader, keyboard-only, pointer-only, device, browser, participant code, trial, and session are researcher-entered ground truth. They are never derived from observations and never change the ten-task order or targets. Accessibility-preference controls should be run separately because reduced motion, contrast, forced colors, and similar preferences can confound comparisons. Pointer and keyboard controls are essential false-positive controls: keyboard navigation can resemble screen-reader-assisted navigation.

Candidate families include passive preferences/environment/API surfaces, bounded page-visible extension aggregates, and task-bounded timing, focus, key-category, activation, semantic traversal, coarse-scroll, and task-performance aggregates. Raw characters, values, pointer coordinates, and trajectories are excluded. Future work may construct participant-disjoint train/test datasets and ablations (traditional/device, passive accessibility, extension, interaction, and their documented combinations), but this version performs no training, scoring, probability estimate, classification, or disability inference. Any future human-participant classification study requires ethics review, cross-user validation, false-positive reporting, and clear separation of labels from observed features.
