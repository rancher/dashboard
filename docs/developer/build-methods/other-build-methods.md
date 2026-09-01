## Other Building Modes

> &#x26a0;&#xfe0f; Documentation in this directory is intended for internal use only. Any information contained here is unsupported.


```bash
# Build for standalone use within Rancher
# (These are done on commit/tag via Drone)
./scripts/build-embedded # for embedding into rancher builds
./scripts/build-hosted # for hosting on a static file webserver and pointing Rancher's ui-dashboard-index at it
# Output in dist/

```
