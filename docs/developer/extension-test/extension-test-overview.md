# Extension Compatibility Test — Overview

> &#x26a0;&#xfe0f; Documentation in this directory is intended for internal use only. Any information contained here is unsupported.

This document describes the **overall process** of the Extension Compatibility Test: what it
proves, how a run is assembled end-to-end, how results are reported to Slack, and how to
operate it. For the exact per-test-case mapping see the
[PDF ↔ Spec Correlation](./extension-test-correlation.md).

- **Workflow:** [`.github/workflows/extension-compatibility-test.yml`](../../../.github/workflows/extension-compatibility-test.yml)
- **Spec:** [`cypress/e2e/tests/pages/extensions/extension-compatibility.spec.ts`](../../../cypress/e2e/tests/pages/extensions/extension-compatibility.spec.ts)
- **k3s launcher:** [`scripts/e2e-extension-k3s-start.sh`](../../../scripts/e2e-extension-k3s-start.sh)
- **Test extension:** `aalves08/elemental-ui` @ `compatibility-tests-version` (developer-loaded)

## Purpose

The test answers one question: **does a single extension build keep working across the
Rancher versions we support?**

The key property is that it exercises the **stock dashboard UI shipped with each Rancher
version** — the workflow never overrides the shipped UI. The same externally-built extension
is dynamically loaded ("developer load") into 2.10, 2.11, 2.12, 2.13, 2.14 and `latest`
(head = 2.15), and a Cypress spec drives every extension point (actions, tabs, panels, cards,
table hooks/columns, and the Shell API).

Version-to-version differences are expressed with `skip_*` flags per matrix row (some
extension points only exist from a given version) rather than by forking the spec — see the
[correlation doc](./extension-test-correlation.md) for the "Since" column.

## Versions under test

| version_label | Rancher image tag | k3s (`KUBE_VERSION`) | Helm channel / registry |
|---|---|---|---|
| `2.10` | `v2.10-head` | `v1.31.1+k3s1` | release-2.10 / Docker Hub |
| `2.11` | `v2.11-head` | `v1.32.13+k3s1` | release-2.11 / `stgregistry.suse.com` |
| `2.12` | `v2.12-head` | `v1.33.12+k3s1` | release-2.12 / `stgregistry.suse.com` |
| `2.13` | `v2.13-head` | `v1.34.8+k3s1` | release-2.13 / `stgregistry.suse.com` |
| `2.14` | `v2.14-head` | `v1.35.5+k3s1` | release-2.14 / Docker Hub |
| `latest` | `head` (2.15) | `v1.36.1+k3s1` | release-2.15 / Docker Hub |

Each row runs on its own runner with its own k3s, so the rows are independent. The matrix is
`fail-fast: false` with `max-parallel: 3` (to bound concurrent multi-GB image pulls).

## How a run is assembled

Each matrix job (`Rancher <version_label>`) runs the following pipeline. The extension is
built **once per job** against a locally-published shell and served to a stock Rancher.

```
Checkout + Node (.nvmrc) + yarn install
        │
        ▼
Verdaccio (local npm registry) ──► Publish @rancher/shell + components + creators @ 99.99.99
        │
        ▼
Clone test extension (elemental-ui) ──► yarn add @rancher/shell@99.99.99 ──► build-pkg
        │                                (backward-compat patch: guard addTableHook etc.)
        ▼
Start extension server (serve-pkgs on :8080)  ── the developer-load catalog
        │
        ▼
Start Rancher: external k3s (KUBE_VERSION) ──► Helm install rancher (image tag per row)
        │        scripts/e2e-extension-k3s-start.sh — served via Traefik ingress over TLS
        ▼
Bootstrap Rancher (admin login w/ retry, server-url, eula, first-login)
        │
        ▼
Wait for cluster API schemas  ──►  Wait for UI login + active local cluster
        │
        ▼
Run Cypress spec (extension-compatibility.spec.ts) with per-version CYPRESS_skip_* flags
        │
        ▼
Upload videos (always) + screenshots (on failure) + cluster diagnostics (on failure)
```

Notable details:

- **Verdaccio + shell `99.99.99`.** The workflow publishes the repo's `shell/`,
  `rancher-components` and `creators` packages to a local Verdaccio registry under a sentinel
  version `99.99.99`, then builds the extension against that. This tests the extension against
  the shell in *this* checkout.
- **Developer load, not a catalog.** The built extension is served by `serve-pkgs` on
  `EXTENSION_SERVER_PORT` (8080) and loaded dynamically; nothing is baked into the Rancher
  image.
- **Stock UI.** [`e2e-extension-k3s-start.sh`](../../../scripts/e2e-extension-k3s-start.sh)
  installs Rancher via **Helm on an external k3s** (a `KUBE_VERSION` compatible with each
  Rancher version) and **never** overrides the shipped dashboard.
- **Backward-compat patching.** Before building, the extension source is patched to guard APIs
  that don't exist on older Rancher (e.g. `addTableHook`), so one extension build loads on all
  versions.

## Triggers & inputs

Defined in the workflow's `on:` block:

- **Schedule:** weekday cron (`17 6 * * 1-5`, 06:17 UTC Mon–Fri).
- **Manual (`workflow_dispatch`)** with inputs:

| Input | Default | Effect |
|---|---|---|
| `rancher_version` | `""` (all) | Test a single row only, e.g. `v2.14-head`. Empty = full matrix. |
| `extension_repo` | `aalves08/elemental-ui.git` | Override the test extension repo. |
| `extension_branch` | `compatibility-tests-version` | Override the extension branch/tag. |

When `rancher_version` is set, non-matching rows short-circuit at the first step ("Skip
non-matching versions"), and the Slack notification is intentionally skipped (single-version
runs are for debugging).

## Results & artifacts

- **Per-job status** is visible in the Actions run; a red row means that version failed.
- **Artifacts:** `cypress-videos-<label>` (always) and `cypress-screenshots-<label>`
  (on failure), plus in-log cluster diagnostics (pods, events, Rancher logs) on failure.
- **Slack:** after the matrix, the `notify-slack` job posts a one-line per-version table to
  Slack (see [Slack notifications](#slack-notifications) below).

## Slack notifications

After the matrix finishes, the `notify-slack` job collapses the six outcomes into a single
status line and posts it to Slack, so the daily result is visible without opening the Actions
tab:

```
✅ Extension Compatibility Test — passed (Run #92, 2026-08-07)
2.10 ✅  |  2.11 ✅  |  2.12 ✅  |  2.13 ✅  |  2.14 ✅  |  latest ✅
Commit a1b2c3d (extension-test)
https://github.com/<owner>/dashboard/actions/runs/<run_id>
https://github.com/<owner>/dashboard/commit/<sha>
```

If any version fails its cell shows `❌` and the header flips to `❌ … failed`. The `Commit`
line is `github.sha` — the ref tip the run built and tested from (the branch on
schedule/dispatch, `master` once merged). The same result and commit link are also written to
the run's **job summary** and log.

| Cell | Job conclusion |
|---|---|
| `✅` | `success` |
| `❌` | `failure` |
| `⏭️` | `skipped` |
| `🚫` | `cancelled` |
| `⚪` | unknown / job not found |

**How it works.** `notify-slack` declares `needs: test-matrix` and `if: always()`, so it fires
even when some rows fail (`always()` overrides the default "skip if a dependency failed"). It
uses no artifacts: each matrix job is named `Rancher <version_label>`, and the job reads each
one's `conclusion` from the GitHub API (`listJobsForWorkflowRun`, which is why it declares
`permissions: actions: read`), then builds the table string.

**Delivery — Workflow Builder trigger.** The target is a Slack
[Workflow Builder](https://slack.com/help/articles/17542172840595-Create-a-workflow-that-starts-with-a-webhook-in-Slack)
**webhook trigger** (URL `https://hooks.slack.com/triggers/…`), *not* a classic incoming
webhook (`…/services/…`). The trigger defines a single data variable, `text`, and expects
`Content-Type: application/json`, so the payload is just `{ "text": "…the table…" }`, sent with
`curl` (the trigger URL is the only credential — no bot token). The Slack workflow then inserts
`text` into its "Send a message" step. (This is why the `slackapi/slack-github-action` used
elsewhere in the repo is *not* used here — it targets classic webhooks with a different
payload.)

**Configuration.**

| Kind | Name | Purpose |
|---|---|---|
| Secret | `SLACK_WEBHOOK_EXTENSION_COMPAT` | The Workflow Builder trigger URL. If unset, the send step logs a notice and exits `0`. |
| Variable | `DISABLE_EXTENSION_COMPAT_TEST` | `true` disables the **whole workflow**. |
| Variable | `DISABLE_EXTENSION_COMPAT_SLACK` | `true` disables **only** the notification. |

The notification posts only on **full runs** (schedule, or dispatch with empty
`rancher_version`), when neither disable variable is `true`, and when the repo owner is
`rancher` or `marcelofukumoto`.

**Setting up the Slack side (reference).** Create a Slack Workflow that starts from a webhook;
add a data variable `text` (string); add a "Send a message" step that inserts `text`; copy the
**Web request URL** into the `SLACK_WEBHOOK_EXTENSION_COMPAT` secret. The Slack dialog shows an
example body of `{ "text": "Example text" }` and content type `application/json`.

**Testing the Slack side** independently of a full ~30-minute matrix run:

```bash
TEXT="✅ Extension Compatibility Test — passed (Run #0, test)
2.10 ✅  |  2.11 ✅  |  2.12 ✅  |  2.13 ✅  |  2.14 ✅  |  latest ✅
(test message)"
jq -n --arg text "$TEXT" '{ text: $text }' \
  | curl -sS -X POST -H 'Content-Type: application/json' --data @- \
      "https://hooks.slack.com/triggers/…"   # the trigger URL
```

A successful post returns `{"ok":true}` (HTTP 200). To change the table, edit the
`notify-slack` → *Build status table* step (`actions/github-script`) in the workflow — keep the
payload a flat `{ "text": … }`, since the trigger only knows the variables defined on it.

## Failure & retry behaviour

There is **no automatic retry**. `fail-fast: false` only means sibling versions keep running
when one fails — the failed row stays failed and is reported as `❌`. Re-run just the failed
rows from the Actions UI ("Re-run failed jobs") or:

```bash
gh run rerun <run_id> -R <owner>/dashboard --failed
```

A failure at a **setup** step (commonly *Start Rancher (Helm on k3s)*, on the older
`2.10`/`2.11` rows) is usually infra flake — a slow image pull tripping a
`kubectl … --timeout` — not a product or test regression. Distinguish it from a **Cypress**
failure (a real extension-point regression) by which step is red.

## Operating the test

| Task | How |
|---|---|
| Run the full matrix on demand | Actions → *Extension Compatibility Test (Cypress)* → **Run workflow** (leave `rancher_version` empty), or `gh workflow run extension-compatibility-test.yml --ref <branch>` |
| Debug a single version | Run workflow with `rancher_version` = e.g. `v2.14-head` (no Slack post) |
| Test an extension branch/PR | Set `extension_repo` / `extension_branch` inputs |
| Disable the whole workflow | Repo variable `DISABLE_EXTENSION_COMPAT_TEST=true` |
| Disable only the Slack post | Repo variable `DISABLE_EXTENSION_COMPAT_SLACK=true` |
| Re-run failed versions | `gh run rerun <run_id> --failed` |

## Related documentation

- [PDF ↔ Spec Correlation](./extension-test-correlation.md) — every test case ↔ spec test, with the version each runs on.
