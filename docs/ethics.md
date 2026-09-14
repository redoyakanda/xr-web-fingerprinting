# Ethics

This is an academic research prototype for local study of browser-exposed fingerprinting features. It does not upload data, add analytics, use external scripts, request camera or microphone access, read geolocation, discover IP addresses, collect motion sensor data, activate XR sessions, record hand/eye/controller movement, or add hidden identifiers.

Participants in future studies should receive informed notice describing what is collected, why it is collected, how exports are handled, and that imported comparison files remain local. Researchers should obtain IRB or equivalent ethics review before collecting data from human participants.

If browser-specific privacy weaknesses are found, researchers should follow responsible disclosure practices with the affected browser or platform vendor. The dashboard must not be presented as creating a permanent identifier or proving uniqueness without population-level evidence.

## Phase D human-participant safeguards

There is no disability-status inference and no screen-reader detector in this release. The model status is `not-trained` and classification is `null`. Passive collection is user initiated; extension observation has a separate explicit activation and bounded window; interaction recording requires confirmation and is task bounded. Cancel, Finish, final-task completion, and Reset remove listeners, and raw events are disabled by default.

Research records remain local until a researcher deliberately downloads them. Local files selected for comparison are parsed in the browser and are not uploaded. Future studies involving people require informed consent, a data-handling plan for pseudonymous participant codes, retention/access controls for exported files, and IRB or equivalent review. Ground truth describes the study condition only; observations must not be reported as proof that a person uses assistive technology or has a disability.
