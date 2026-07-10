# Methodology

## Research goal

The platform supports repeatable study of browser-exposed fingerprinting features in XR and desktop browsers. Results are observed feature vectors, not unique device identifiers.

## Passive collection model

Collectors inspect API availability, coarse capabilities, rendering summaries, and exposed metadata without uploading data, adding analytics, opening sensors, requesting XR sessions, or collecting motion, camera, microphone, geolocation, IP address, or behavioral data.

## Feature categories

Categories include platform, display, viewport, graphics, audio rendering summaries, WebGPU, WebXR availability, permissions states, storage capability, coarse network API availability, predefined font checks, CSS media queries, feature detection, and static gamepad metadata.

## Availability, capability, and use

An interface being present does not prove permission, runtime capability, or actual use. WebXR support does not mean an XR session was requested. Gamepad exposure does not include axes, buttons, pose, or activity polling.

## Repeated-measurement protocol

Collect and compare repeated exports for: same browser and same session, browser restart, device restart, different network, private browsing, browser update, and OS update. Document browser version, device family, secure-context status, and whether unsupported APIs were expected.

## Device-comparison plan

Compare within-device stability before cross-device comparison. Treat similarity as a descriptive field comparison only; do not infer entropy or population uniqueness without a larger study.
