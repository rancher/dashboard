---
name: Dead Code Detector
description: Identifies dead and unused code across the codebase and removes it where removal is provably safe
on:
  schedule: daily
  # Manual dispatch is kept enabled while the remediation path is being proven out.
  workflow_dispatch:
  # Deterministic budget gate, evaluated before the agent starts. The shared
  # reporting protocol asks the agent to count its own open pull requests and
  # stand down at three; this enforces the number without trusting it to.
  # Three unreviewed bot pull requests is the reviewer load this workflow may
  # impose, and the count drops only when a person merges or closes one.
  #
  # Scoped to pull requests, not issues, on purpose. Every run starts by
  # remediating the open issues this workflow filed, so skipping on an
  # open-issue count would stop the only thing that closes them: three issues
  # would wedge the workflow until someone closed them by hand. Issue cap is
  # `create-issue.max` below, plus "Filing when the backlog is full".
  skip-if-match:
    query: "is:pr is:open label:bot/dead-code-detector"
    max: 3

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
    # Use the branch name the agent asked for, verbatim. Without this the
    # handler appends 16 hex characters of collision salt, turning
    # `dead-code/75-poller-sequential` into
    # `dead-code/75-poller-sequential-39272520176721d9`.
    preserve-branch-name: true
    # Required alongside the above. With preserve-branch-name on, a branch name
    # that already exists on the remote is a hard error and the pull request is
    # dropped — and these names collide by design, since re-picking issue 75
    # regenerates `dead-code/75-...`. A leftover branch here only ever belongs
    # to a pull request that was closed or merged, so recreating it is safe:
    # anything still open would have been filtered out by the budget check
    # before a fix was attempted.
    recreate-ref: true
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
  # Refuting a wrong issue, correcting an incomplete one, and flagging an open
  # pull request that has fallen behind its base are all done by commenting
  # rather than by filing a corrected duplicate or force-pushing someone's
  # branch. Six slots so the rebase notices do not crowd out the refutations.
  add-comment:
    target: "*"
    max: 6
tools:
  # Bash access is required: remediation runs yarn lint, yarn type-check:ci and yarn test:ci,
  # and detection uses git, grep and wc. Declared explicitly because min-integrity: none
  # requires it in strict mode.
  bash:
    - cat
    - ls
    - find
    - grep
    - head
    - tail
    - wc
    - git
    - yarn
    - node
  github:
    min-integrity: none
env:
  # The Copilot harness arms an inactivity watchdog as soon as the run's first
  # safe output lands, and SIGTERMs the agent when it next goes quiet. The
  # default is 20s, which `create_pull_request` cannot survive: staging and
  # pushing a branch takes longer than that and emits nothing while it runs, so
  # the call is aborted and the run ends with an issue but no pull request.
  # Ten minutes covers a push on a repository this size.
  GH_AW_HARNESS_WATCHDOG_TIMEOUT_MS: "600000"
# Remediation runs `yarn lint` and `yarn test:ci` before opening a pull request,
# and a UI removal additionally builds and records the dashboard, so the budget
# has to cover a dependency install, a full unit test run and a dev build.
timeout-minutes: 75
---

# Dead Code Detection

Remove dead code from this repository, and report what cannot yet be removed.

The sections above are the house rules: the runtime, how to capture UI evidence, how findings become issues and pull requests, how lessons are recorded. This section is the dead-code part — what counts as a candidate, what may never be one, and how candidates group into the clusters that become issues.

Read them together. Where the shared protocol says "finding", read [**cluster**](#clusters). Where it writes `<bot-label>`, substitute `bot/dead-code-detector`.

- **Bot label**: `bot/dead-code-detector`
- **Branch prefix**: `dead-code/` — a pull request on any other branch is rejected before it is opened
- **Lessons file**: `.github/agents/lessons/dead-code.md`
- **Budgets**: **three** open pull requests carrying the bot label, **three** open issues carrying it, **three** issues filed per run, **six** comments — the comments shared between refutations, corrections and the rebase notices in "Keeping the open pull requests mergeable"

The pull request budget is enforced before you start: a fourth open one skips the run and you never see this prompt. The issue budget is yours to hold — see "Filing when the backlog is full".

The lessons file holds the search idioms that have produced false findings here, plus the confidence rubric under "Provenance and confidence". It binds this run as hard as this section does, so nothing below repeats it. Read it before composing a search, not after.

## Filing when the backlog is full

The three-open-issues cap counts issues **open at once**, not issues filed this run. Count first: `list_issues` with `labels: ["bot/dead-code-detector"], state: "OPEN"`.

That count and the per-run cap of three both apply, smaller one wins. Two already open leaves room for one, not three.

**At three or more, file nothing new.** Detection still runs, because what it turns up decides whether the run has anything to say — but a verified finding with no slot goes in the run summary and waits for a later run.

Remediation is unaffected. A full backlog is exactly when clearing it matters, and the pull requests closing those issues are what makes room.

This cap is deliberately not harness-enforced. Gating the run on an open-issue count would stop remediation, the only thing that closes these issues, and three of them would wedge the workflow until a person closed them by hand.

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

- **A test file on its own.** The runner finds tests by glob, so nothing imports one and "unreferenced" says nothing about it. Never a finding by itself — though not exempt from removal either: where the code it covers is dead, the test is part of that cluster and is verified to the same standard
- **Any workflow file** — anything under `.github/workflows/`
- Generated code, vendored dependencies, and type declarations required for compilation

The lessons file adds two more categories: "Convention directories are loaded by a template-literal import" and "Entry points have no importers by design". Read both before deciding anything is unreferenced.

## Clusters

A cluster is one directory plus whatever its members transitively drag in. Build it by following imports in both directions:

1. Read the imports of each confirmed-dead file
2. For every in-repo module it imports, re-run the reference check while treating the already-confirmed-dead files as if they had been deleted
3. Anything whose only remaining consumers are dead joins the cluster. Repeat until the set stops growing
4. Work upwards too: a candidate whose only importer is itself unreferenced pulls that importer into the cluster
5. Add the tests. A test file joins the cluster when the code it covers does — but read its imports first and confirm every one is already in the cluster. A test that also exercises live code is not dead, and finding one means the cluster is smaller than it looked

**No minimum size.** Report every cluster you can verify, however small. A single unused constant is still dead code.

More clusters verified than the issue budget allows: file the largest first, leave the rest for the next run.

## What the issue and the pull request must say

On top of the shared templates, the evidence sections here carry:

- **Control search** — the same command run against a symbol known to be live, with its hit count
- **Dynamic resolution ruled out** — which `require.context` globs were re-grepped and which convention directories were checked
- **What the dead files drag in** — the extra files the cluster walk added by following their imports, or "none — everything they import is still used elsewhere"
- **Tests removed** — each test file in the cluster and the code it covers, or "none"
- **Provenance shape** — which of the three in the lessons file this is, with the git output establishing it. State the shape, never restate the rubric

A removal touches the UI, and so needs evidence, whenever it deletes or edits a `.vue`, `.scss` or translation file. See "Capturing UI evidence" for the full boundary and the capture steps.

**Objective: reduce the codebase and the backlog together.** A run succeeds by filing what it found and removing what it can — deleting verified-dead code, disproving a wrong report, or recording a lesson that stops the next run repeating a mistake. Not by producing the most output.
