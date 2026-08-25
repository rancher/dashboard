---
name: Dead Code Detector
description: Identifies dead and unused code across the codebase and removes it where removal is provably safe
on:
  schedule: daily
  # Manual dispatch is kept enabled while the remediation path is being proven out.
  workflow_dispatch:

if: (github.repository_owner == 'rancher' || vars.ENABLE_AGENTIC_WORKFLOWS == 'true') && vars.DISABLE_AW_DEAD_CODE_DETECTOR != 'true'

# Runtime environment, UI evidence capture, the issue/pull-request protocol and
# the lessons protocol are shared with the other agentic workflows in this repo.
# Editing the prose in these files takes effect on the next run without a
# recompile; editing their frontmatter does not.
imports:
  - shared/rancher-server.md
  - shared/evidence.md
  - shared/report-and-fix.md
  - shared/lessons.md

permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
safe-outputs:
  create-issue:
    title-prefix: "[dead-code] "
    labels: [bot/dead-code-detector, bot/skip-grooming]
    group: true
    max: 3
  create-pull-request:
    draft: true
    title-prefix: "[dead-code] "
    labels: [bot/dead-code-detector, "QA/None"]
    # Mirrors the create-issue budget above. "The pull request budget" in the
    # shared reporting protocol is this number; keep the two in step.
    max: 3
    if-no-changes: ignore
    # Enforces the branch naming rule declaratively, so the prompt does not have
    # to be trusted to follow it. Covers both `dead-code/<issue>-<slug>` and the
    # `dead-code/new-<slug>` form a same-run pair uses.
    allowed-branches:
      - "dead-code/*"
    # Exclusive allowlist: a patch touching anything outside this set is refused.
    # A dead code removal has no business anywhere else.
    allowed-files:
      - "shell/**"
      - "pkg/**"
      - "cypress/**"
      - "storybook/**"
      - "docusaurus/**"
      - "creators/**"
      - ".github/agents/lessons/dead-code.md"
    protected-files:
      policy: request_review
      # The detector maintains its own lessons file. Everything else under
      # .github/ stays protected — in particular it must never touch
      # .github/workflows/.
      exclude:
        - .github/agents/lessons/
  # Refuting a wrong issue and correcting an incomplete one are both done by
  # commenting rather than by filing a corrected duplicate.
  add-comment:
    target: "*"
    max: 3
tools:
  github:
    min-integrity: none
# Remediation runs `yarn lint` and `yarn test:ci` before opening a pull request,
# and a UI removal additionally builds and records the dashboard, so the budget
# has to cover a dependency install, a full unit test run and a dev build.
timeout-minutes: 75
---

# Dead Code Detection

Remove dead code from this repository, and report what cannot yet be removed.

The sections above are the house rules — the runtime you are running in, how to capture UI evidence, how findings become issues and pull requests, and how lessons are recorded. This section is the part specific to dead code: what counts as a candidate, what may never be one, and how candidates group into the clusters that become issues.

Read them together. Wherever the shared protocol says "finding", it means a [**cluster**](#clusters), and wherever it writes `<bot-label>`, substitute `bot/dead-code-detector`.

- **Bot label**: `bot/dead-code-detector`
- **Branch prefix**: `dead-code/` — a pull request on any other branch is rejected before it is opened
- **Lessons file**: `.github/agents/lessons/dead-code.md`
- **Budgets**: at most **three** open pull requests carrying the bot label at a time, and at most **three** issues filed per run

The lessons file holds the search idioms that have produced false findings here and the confidence rubric under "Provenance and confidence". It binds this run with the same force as this section, so nothing below repeats it. Read it before composing a search, not after.

## Context

- **Repository**: ${{ github.repository }}
- **Triggered by**: @${{ github.actor }}
- **Commit**: run `git rev-parse --short HEAD` in the workspace and quote the result. Do not describe the commit any other way

## What to look for

Start from the files changed in recent commits (`git log`, `git diff`) under `shell/` and `pkg/`, then widen.

- **Unused exports** — `export` declarations never imported anywhere, accounting for re-exports and barrel files
- **Orphaned Vue components** — components never referenced in any template, route definition, or dynamic import
- **Unreferenced utility functions** — functions in `shell/utils/` and equivalents with no callers
- **Test-only code** — modules whose only importers are their own tests
- **Dead routes** — route definitions pointing at components that no longer exist

**Search the whole repository**, not only `shell/` and `pkg/`. `cypress/`, `storybook/`, `docusaurus/` and `creators/` all reference code under `shell/`, and a reference can live in a `.vue`, `.ts`, `.js`, `.json`, `.scss`, `.md` or `.yaml` file.

## Never reported

- **A test file on its own.** The runner finds tests by glob, so nothing imports one and "unreferenced" says nothing about it. A test is never a finding by itself — but it is not exempt from removal either: when the code it covers is dead, the test is part of that cluster and is verified to the same standard as the rest of it
- **All workflow files** — anything under `.github/workflows/`
- Generated code, vendored dependencies, and type declarations required for compilation

The lessons file adds two more categories, under "Convention directories are loaded by a template-literal import" and "Entry points have no importers by design". Read both before deciding anything is unreferenced.

## Clusters

A cluster is one directory plus whatever its members transitively drag in. Build it by following imports in both directions:

1. Read the imports of each confirmed-dead file
2. For every in-repo module it imports, re-run the reference check while treating the already-confirmed-dead files as if they had been deleted
3. Anything whose only remaining consumers are dead joins the cluster; repeat until the set stops growing
4. Work upwards too: if a candidate's only importer is itself unreferenced, that importer joins the cluster
5. Add the tests. A test file joins the cluster when the code it covers does — but read its imports first and confirm every one of them is already in the cluster. A test that also exercises live code is not dead, and finding one means the cluster is smaller than it looked

**There is no minimum size.** Report every cluster you can verify, however small: a single unused constant is still dead code. When more clusters are verified than the issue budget allows, file the largest first and leave the rest for the next run.

## What the issue and the pull request must say

On top of the shared templates, the evidence sections here carry:

- **Control search** — the same command run against a symbol known to be live, with its hit count
- **Dynamic resolution ruled out** — which `require.context` globs were re-grepped and which convention directories were checked
- **What the dead files drag in** — the extra files the cluster walk added by following their imports, or "none — everything they import is still used elsewhere"
- **Tests removed** — each test file in the cluster and the code it covers, or "none"
- **Provenance shape** — which of the three in the lessons file this is, with the git output establishing it. State the shape; do not restate the rubric

A removal touches the UI, and therefore needs evidence, whenever it deletes or edits a `.vue`, `.scss` or translation file — see "Capturing UI evidence" for the full boundary and the capture steps.

**Objective**: reduce the codebase and the backlog together. A run succeeds when it files what it found and removes what it can — deleting verified-dead code, disproving a wrong report, or recording a lesson that stops the next run repeating a mistake. Not when it produces the most output.
