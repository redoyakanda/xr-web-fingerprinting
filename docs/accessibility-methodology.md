# Accessibility measurement methodology

## Phase B: page-visible extension artifacts

Browsers generally do not expose a general installed-extension enumeration API to ordinary webpages. Phase B asks only whether an accessibility-related extension can leave artifacts visible through ordinary page APIs. It does not identify installed add-ons, probe `chrome-extension://` or `moz-extension://` resources, scan extension IDs, fetch manifests, use network/timing probes, or inspect extension storage or internals.

The user must explicitly select **Observe Extension Artifacts**. The module takes lightweight element counts and global own-property names, starts one conservatively configured `MutationObserver`, and stops automatically after the default two-second (2000 ms) window. It watches the current document for child-list and attribute changes with `characterData: false`, and disconnects before returning a compact aggregate. It never retains a DOM snapshot, page or typed text, script or stylesheet content, passwords, clipboard contents, or sensor data.

Artifacts do **not** prove screen-reader use or disability status. An accessibility extension may be installed but inactive; a non-accessibility extension or the page itself may make the same changes. False positives and false negatives are expected and require experimental evaluation. There is no detector or classifier: `screenReaderDetectionModelStatus` remains `"not-trained"` and `classification` remains `null`.

The intended controlled comparison is **Extension OFF** versus **Extension ON** under identical browser, device, page, and task conditions. Results stay local unless manually downloaded. There is no backend, upload, analytics, remote logging, or third-party script.

## Phase C task-bounded interaction methodology

Phase C compares researcher-labelled SR ON and SR OFF trials and the keyboard-only, pointer-only, and accessibility-preference controls using one fixed twenty-task sequence. Labels are manual ground truth and are never inferred or overwritten. Participant codes must be pseudonymous.

Recording starts only after the participant notice is confirmed and the Start control is activated. It ends on explicit task completion and Finish (or Cancel), when every listener and pending scroll timer is removed. **Experiment duration is a measured outcome. It is not the stopping condition.** There is no 30-, 60-, 120-second, or other time cutoff; natural 20-second, one-minute, and multi-minute trials follow identical lifecycle rules.

Focus semantics, navigation-key categories, coarse activations, and throttled coarse scrolling become task summaries and aggregate candidate features only after completion. Raw-event export is disabled by default. Characters, passwords, form values, editable content, pointer coordinates/trajectories, speech, and sensors are excluded even from internal event metadata.

Scrolling is attributed only to the independently scrollable standardized sample webpage (`#interaction-task-area`). Its scroll listener and distance baseline are attached directly to that element. Window/document scrolling used to reach researcher instructions, task controls, Finish, or other dashboard panels is not observed and therefore cannot contribute to scroll aggregates or per-task interaction counts. When the source of movement cannot be attributed to the sample webpage, it is excluded rather than inferred.

No detector or classifier is trained or run. Keyboard-only behavior may resemble screen-reader behavior, so false positives must be tested explicitly. Interaction also differs among NVDA, JAWS, Narrator, VoiceOver, TalkBack, Orca, browsers, devices, and platforms; candidate signals must not be treated as evidence of disability.

## Phase D controls, ground truth, and future analysis

SR ON/OFF, named screen reader, keyboard-only, pointer-only, device, browser, participant code, trial, and session are researcher-entered ground truth. They are never derived from observations and never change the twenty-task order or targets. Accessibility-preference controls should be run separately because reduced motion, contrast, forced colors, and similar preferences can confound comparisons. Pointer and keyboard controls are essential false-positive controls: keyboard navigation can resemble screen-reader-assisted navigation.

Candidate families include passive preferences/environment/API surfaces, bounded page-visible extension aggregates, and task-bounded timing, focus, key-category, activation, semantic traversal, coarse-scroll, and task-performance aggregates. Raw characters, values, pointer coordinates, and trajectories are excluded. Future work may construct participant-disjoint train/test datasets and ablations (traditional/device, passive accessibility, extension, interaction, and their documented combinations), but this version performs no training, scoring, probability estimate, classification, or disability inference. Any future human-participant classification study requires ethics review, cross-user validation, false-positive reporting, and clear separation of labels from observed features.

## Observable traversal and task boundary (task set 2.0.0)
The twenty identical-condition tasks form a small accessible sample site covering skip, headings, navigation and links, buttons, forms and validation, dialog, landmarks, table, nested lists, tabs, disclosure, live status, dynamic content, alert, and local search. Research controls do not belong to the experiment task area and cannot contribute events.

At initialization meaningful task-area elements receive stable document-order indices. Consecutive focused indices produce a signed delta: +1/-1 are adjacent transitions, values greater than +1 are forward skips, values below -1 are backward jumps, and zero is refocus. The export includes distances, direction changes, visited coverage, adjacent-transition ratio, jump ratio, and the same calculations per task. `observableSequentialTransitionRatio` is the proportion of valid transitions with `|delta| == 1`. It describes **page-observable focus traversal**, not a screen-reader score or complete screen-reader navigation sequence. A screen reader's virtual/browse cursor can move without changing DOM focus.

`focusWithoutPriorPointerCount` means: “A focus transition for which the collector did not observe a qualifying preceding pointer interaction.” Qualifying means an in-task `pointerdown` or click occurred less than `priorPointerWindowMs` (fixed at 1000 ms and exported in experiment configuration) before focus. It does not identify the cause of focus.

Key events retain browser-reported event-category semantics; printable keys are reduced to `text-input-key`. Mobile browsers and assistive technologies may synthesize key-like, click, or pointer events, so categories must not be reinterpreted as physical-device or screen-reader commands.
