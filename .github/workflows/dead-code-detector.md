---
name: Dead Code Detector
description: Identifies dead and unused code across the codebase and removes it where removal is provably safe
on:
  schedule: daily
  # Manual dispatch is kept enabled while the remediation path is being proven out.
  workflow_dispatch:

if: (github.repository_owner == 'rancher' || vars.ENABLE_AGENTIC_WORKFLOWS == 'true') && vars.DISABLE_AW_DEAD_CODE_DETECTOR != 'true'

# Runtime environment, UI evidence capture, the issue/pull-request protocol, the
# lessons protocol and the house writing rules are shared with the other agentic
# workflows in this repo. Editing the prose in these files takes effect on the
# next run without a recompile; editing their frontmatter does not.
imports:
  - shared/rancher-server.md
  - shared/evidence.md
  - shared/fix-from-backlog.md
  - shared/report-findings.md
  - shared/lessons.md
  - shared/writing.md

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
  # Unrestricted, and it has to be: remediation shells out to yarn, git, node
  # and docker, and a candidate's provenance is established with `git log -S`
  # over the full history. An allowlist here fails a run halfway through on the
  # first command nobody thought of. The compiler requires this to be spelled
  # out whenever `min-integrity` is `none`, so that shell access is deliberate.
  bash: [":*"]
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

Remove dead code from this repository, report what cannot yet be removed.

Sections above are house rules — runtime you run in, how to capture UI evidence, how findings become issues and pull requests, how lessons are recorded. This section is the dead-code part: what counts as a candidate, what never does, how candidates group into the clusters that become issues.

Read them together. Wherever the shared protocol says "finding" it means a [**cluster**](#clusters); wherever it writes `<bot-label>` or `<candidate-labels>`, substitute `bot/dead-code-detector` — one label for both, because the only issues this workflow fixes are the ones it filed.

Every run does **both**, in order:

1. **Remediate the backlog** — open issues carrying the bot label from earlier runs: re-verify each from scratch, then either fix it and open the pull request closing it, or comment with the disproof where re-verification kills it. See "Remediation protocol"
2. **Find what is new** — look for what nobody reported yet, file an issue per verified finding. Budget still has room after step 1: fix it this run too and open the pull request beside its issue. See "Reporting protocol"

Neither phase is a fallback for the other. Full backlog does not excuse skipping detection; empty backlog does not make detection the whole run. Every finding gets an issue, every resolvable issue gets the pull request resolving it: issue is the record, pull request is the fix, one without the other is half the job.

- **Bot label**: `bot/dead-code-detector`
- **Branch prefix**: `dead-code/` — pull request on any other branch is rejected before it opens
- **Lessons file**: `.github/agents/lessons/dead-code.md` — yours to append to. The other files beside it belong to other workflows: read those too, write to neither
- **Budgets**: at most **three** open pull requests carrying the bot label at a time, **three** issues filed per run, **six** comments — shared between refutations, corrections and the rebase notices in "Keeping open pull requests mergeable"

Your lessons file holds the search idioms that produced false findings here, plus the confidence rubric under "Provenance and confidence". It binds this run as hard as this section, so nothing below repeats it. Read it, and the others in that directory, before composing a search — not after.

## Context

- **Repository**: ${{ github.repository }}
- **Triggered by**: @${{ github.actor }}
- **Commit**: run `git rev-parse --short HEAD` in the workspace, quote the result. Never describe the commit any other way

## What to look for

Start from files changed in recent commits (`git log`, `git diff`) under `shell/` and `pkg/`, then widen.

- **Unused exports** — `export` declarations never imported anywhere, accounting for re-exports and barrel files
- **Orphaned Vue components** — never referenced in any template, route definition or dynamic import
- **Unreferenced utility functions** — functions in `shell/utils/` and equivalents with no callers
- **Test-only code** — modules whose only importers are their own tests
- **Dead routes** — route definitions pointing at components that no longer exist

**Search the whole repository**, not only `shell/` and `pkg/`. `cypress/`, `storybook/`, `docusaurus/` and `creators/` all reference code under `shell/`, and a reference can live in a `.vue`, `.ts`, `.js`, `.json`, `.scss`, `.md` or `.yaml` file.

## Never reported

- **A test file on its own.** The runner finds tests by glob, so nothing imports one and "unreferenced" says nothing about it. Never a finding by itself — but not exempt from removal either: when the code it covers is dead, the test joins that cluster and is verified to the same standard
- **All workflow files** — anything under `.github/workflows/`
- Generated code, vendored dependencies, type declarations required for compilation

The lessons file adds two more categories, under "Convention directories are loaded by a template-literal import" and "Entry points have no importers by design". Read both before calling anything unreferenced.

## Clusters

A cluster is one directory plus whatever its members transitively drag in. Build it by following imports both ways:

1. Read the imports of each confirmed-dead file
2. For every in-repo module it imports, re-run the reference check treating already-confirmed-dead files as deleted
3. Anything whose only remaining consumers are dead joins the cluster; repeat until the set stops growing
4. Work upwards too: a candidate's only importer, itself unreferenced, joins the cluster
5. Add the tests. A test joins when the code it covers does — but read its imports first and confirm every one is already in the cluster. A test also exercising live code is not dead, and finding one means the cluster is smaller than it looked

**No minimum size.** Report every cluster you can verify, however small: one unused constant is still dead code. More clusters verified than the issue budget allows: file the largest first, leave the rest for the next run.

## What the issue and the pull request must say

On top of the shared templates, evidence sections here carry:

- **Control search** — same command against a symbol known to be live, with hit count
- **Dynamic resolution ruled out** — which `require.context` globs were re-grepped, which convention directories were checked
- **What the dead files drag in** — extra files the cluster walk added by following their imports, or "none — everything they import is still used elsewhere"
- **Tests removed** — each test file in the cluster and the code it covers, or "none"
- **Provenance shape** — which of the three in the lessons file this is, with the git output establishing it. State the shape; never restate the rubric

A removal touches the UI, and so needs evidence, whenever it deletes or edits a `.vue`, `.scss` or translation file — see "Capturing UI evidence" for the boundary and the capture steps.

**Objective**: shrink codebase and backlog together. A run succeeds when it files what it found and removes what it can — deleting verified-dead code, disproving a wrong report, or recording a lesson that stops the next run repeating a mistake. Not when it produces the most output.
