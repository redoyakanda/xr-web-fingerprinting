# Accessibility measurement methodology

## Phase B: page-visible extension artifacts

Browsers generally do not expose a general installed-extension enumeration API to ordinary webpages. Phase B asks only whether an accessibility-related extension can leave artifacts visible through ordinary page APIs. It does not identify installed add-ons, probe `chrome-extension://` or `moz-extension://` resources, scan extension IDs, fetch manifests, use network/timing probes, or inspect extension storage or internals.

The user must explicitly select **Observe Extension Artifacts**. The module takes lightweight element counts and global own-property names, starts one conservatively configured `MutationObserver`, and stops automatically after the default two-second (2000 ms) window. It watches the current document for child-list and attribute changes with `characterData: false`, and disconnects before returning a compact aggregate. It never retains a DOM snapshot, page or typed text, script or stylesheet content, passwords, clipboard contents, or sensor data.

Artifacts do **not** prove screen-reader use or disability status. An accessibility extension may be installed but inactive; a non-accessibility extension or the page itself may make the same changes. False positives and false negatives are expected and require experimental evaluation. There is no detector or classifier: `screenReaderDetectionModelStatus` remains `"not-trained"` and `classification` remains `null`.

The intended controlled comparison is **Extension OFF** versus **Extension ON** under identical browser, device, page, and task conditions. Results stay local unless manually downloaded. There is no backend, upload, analytics, remote logging, or third-party script.
