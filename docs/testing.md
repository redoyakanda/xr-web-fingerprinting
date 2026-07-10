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
