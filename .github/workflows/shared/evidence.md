---
# Shared component: capturing and publishing UI evidence.
#
# Import with:  imports: [shared/evidence.md]
#
# Requires shared/rancher-server.md for the backend and the Playwright CLI.
safe-outputs:
  # `.webm` is what the Playwright CLI produces; `.png` is there so a run that
  # cannot record can still show a still of the screen it reached, and because a
  # still is the only form that renders inline in an issue or pull request body.
  upload-asset:
    allowed-exts: [".webm", ".png"]
    # KB. A minute of 1280x720 VP8 lands well under this; the ceiling is here to
    # stop a runaway recording being committed to the assets branch.
    max-size: 20480
    max: 6
---

## Capturing UI evidence

A change to what the dashboard renders needs a recording of the dashboard still rendering. A passing test suite is not that evidence: it never touched the screen.

**A change touches the UI** if it adds, deletes or edits any `.vue` or `.scss` file, anything under `shell/pages/`, `shell/components/`, `shell/detail/`, `shell/edit/`, `shell/list/`, `shell/dialog/`, `shell/promptRemove/`, `shell/chart/`, `shell/cloud-credential/`, `shell/machine-config/` or the `pkg/*/` equivalents, or any translation key. A change confined to `.ts`/`.js` under `shell/utils/` or `shell/config/`, or to `cypress/`, `storybook/`, `docusaurus/` or `creators/`, does not — say so in the Evidence section of the body rather than attaching nothing without explanation.

Capture only **after** `yarn lint` and `yarn test:ci` have passed. A recording of a broken build shows nothing worth reviewing.

1. Serve the dashboard from the working tree, against the Rancher described under "Runtime environment", and wait for the first compile:

   ```bash
   # <rancher-host> is whichever address the probe under "Runtime environment" showed
   # answering 200 — substitute it literally, do not assume which of the three it was.
   API=https://<rancher-host>:9443 nohup yarn dev > /tmp/gh-aw/agent/dashboard-dev.log 2>&1 &
   # vue-cli-service prints "Compiled successfully" once the app is servable. This takes
   # several minutes; poll the log rather than guessing at a sleep.
   timeout 900 bash -c 'until grep -q "Compiled successfully" /tmp/gh-aw/agent/dashboard-dev.log; do sleep 10; done'
   ```

   A compile failure is a failed gate — quote what it printed, and open no pull request. A compile that does not finish inside the timeout is not: open the pull request without a video and say which of the two happened.

2. Record the walkthrough, and take at least one still. The dev server's certificate is self-signed, so the browser has to be told to accept it, and that has to be set before the session is opened:

   ```bash
   export PLAYWRIGHT_MCP_IGNORE_HTTPS_ERRORS=true
   playwright-cli open https://localhost:8005
   # Name the files after the branch's last segment so the assets are traceable.
   playwright-cli video-start /tmp/gh-aw/agent/<branch-suffix>.webm --size 1280x720
   # log in as admin / password, then walk the screens
   playwright-cli video-chapter "<screen name>" --duration=2000
   # ... snapshot / click / goto for each screen ...
   playwright-cli video-stop
   playwright-cli screenshot /tmp/gh-aw/agent/<branch-suffix>.png
   playwright-cli close
   ```

3. Visit **every** screen the change affects, plus the screen that reaches it. Mark each with a `video-chapter` so a reviewer can find it without scrubbing
4. Run `playwright-cli console error` on each screen. An error the change introduced is a failed change, not a caveat to note in the body — abandon it
5. Keep the video under a minute. A recording nobody watches is worse than a screenshot somebody does — if the walkthrough will not fit, cut it to the one screen that matters

### Publishing and embedding

Call the `upload_asset` tool with the file path. It returns a URL **immediately**, before the run ends, of the form `https://github.com/<owner>/<repo>/blob/assets/<workflow>/<sha256>.<ext>?raw=true`. Paste that URL into the bodies you write; do not try to construct it yourself, and do not wait for anything.

The same asset can be referenced from more than one body. Upload once, and put the same URL in the issue **and** in the pull request that fixes it.

How to embed each kind:

- **A `.png` renders inline** in an issue or pull request body. Write it as `![<what the screen shows>](<url>)`
- **A `.webm` does not render inline** from this kind of URL — GitHub only auto-embeds video for its own attachment host. Write it as a plain markdown link, `[Walkthrough recording (webm)](<url>)`, and put an inline `.png` still above it. A `<video src>` tag pointing at this URL renders as nothing at all, so never use one

The assets are pushed to their branch by a job that runs **in parallel** with the one that creates issues and pull requests, so a URL can 404 for a few seconds after the body is posted. That is expected and self-corrects; it is not a reason to retry the upload.

If a recording could not be produced at all, take a `playwright-cli screenshot` of the affected screen instead, publish that, and say in the body why there is no video.
