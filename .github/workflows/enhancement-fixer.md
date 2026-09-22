---
name: Enhancement Fixer
description: Picks up small, well-specified enhancement issues and opens the pull request that resolves them
on:
  schedule: daily
  # The opt-in queue. `names:` compiles to a guarded condition so the workflow
  # does not wake on every label event on the repository. Deliberately not
  # gh-aw's `label_command:` trigger, which looks like the closer fit but
  # *removes* the label once it has activated — the label has to survive as a
  # queue the scheduled run can drain, and keeping it also avoids needing
  # `issues: write`.
  issues:
    types: [labeled]
    names: [bot/enhancement-fixer/ready]
  # Manual dispatch is kept enabled while the scope gate is being calibrated.
  workflow_dispatch:

if: (github.repository_owner == 'rancher' || vars.ENABLE_AGENTIC_WORKFLOWS == 'true') && vars.DISABLE_AW_ENHANCEMENT_FIXER != 'true'

# Runtime environment, UI evidence capture and the lessons protocol are shared
# with the other agentic workflows in this repo. `fix-from-backlog.md` is the
# half of the reporting protocol that turns an open issue into a pull request;
# this workflow does not import `report-findings.md`, because it never files an
# issue of its own. Editing the prose in these files takes effect on the next
# run without a recompile; editing their frontmatter does not.
imports:
  - shared/rancher-server.md
  - shared/evidence.md
  - shared/fix-from-backlog.md
  - shared/lessons.md

permissions:
  contents: read
  issues: read
  pull-requests: read
  copilot-requests: write
safe-outputs:
  # No `create-issue`. This workflow resolves issues other people wrote; it has
  # nothing of its own to file, and a bot that answers an issue by opening
  # another issue is noise.
  create-pull-request:
    draft: true
    title-prefix: "[enhancement] "
    # No QA label. The dead code detector earns `QA/None` by only ever deleting
    # unreferenced code; every change this workflow makes is user-visible and
    # needs a human to set the real one.
    labels: [bot/enhancement-fixer]
    # "The pull request budget" in the shared remediation protocol is this
    # number. Two, not three: each of these is a judgement call a reviewer has
    # to make, and they queue up faster than deletions do.
    max: 2
    if-no-changes: ignore
    # Enforces the branch naming rule declaratively, so the prompt does not have
    # to be trusted to follow it.
    allowed-branches:
      - "enhancement/*"
    # Use the branch name the agent asked for, verbatim. Without this the
    # handler appends 16 hex characters of collision salt, turning
    # `enhancement/42-empty-state-copy` into
    # `enhancement/42-empty-state-copy-39272520176721d9`.
    preserve-branch-name: true
    # Required alongside the above. With preserve-branch-name on, a branch name
    # that already exists on the remote is a hard error and the pull request is
    # dropped — and these names collide by design, since re-picking issue 42
    # regenerates `enhancement/42-...`. A leftover branch here only ever belongs
    # to a pull request that was closed or merged, so recreating it is safe:
    # anything still open would have been filtered out by the budget check
    # before a fix was attempted.
    recreate-ref: true
    # Exclusive allowlist: a patch touching anything outside this set is refused.
    allowed-files:
      - "shell/**"
      - "pkg/**"
      - "cypress/**"
      - "storybook/**"
      - "docusaurus/**"
      - "creators/**"
      - ".github/agents/lessons/enhancements.md"
    protected-files:
      policy: request_review
      # This workflow maintains its own lessons file. Everything else under
      # .github/ stays protected — in particular it must never touch
      # .github/workflows/.
      exclude:
        - .github/agents/lessons/
  # Declining a nominated issue, and flagging an open pull request that has
  # fallen behind its base, are both done by commenting. Four slots so the
  # rebase notices do not crowd out the declines.
  add-comment:
    target: "*"
    max: 4
tools:
  # Unrestricted, and it has to be: resolving an issue shells out to yarn, git,
  # node and docker, and there is no way to predict which of them a given
  # enhancement needs. An allowlist here fails a run halfway through on the
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
  # the call is aborted and the run ends with no pull request. Ten minutes
  # covers a push on a repository this size.
  GH_AW_HARNESS_WATCHDOG_TIMEOUT_MS: "600000"
# Every change here is user-visible, so every pull request needs a dev build and
# a recorded walkthrough on top of a dependency install and a full unit test run.
timeout-minutes: 75
---

# Enhancement Fixing

Resolve small, well-specified enhancement issues, and say plainly which ones cannot be resolved this way.

Sections above are house rules — runtime you run in, how to capture UI evidence, how an open issue becomes a pull request, how lessons are recorded. This section is the enhancement part: which issues are candidates, which never are, what a pull request must prove before it opens.

Read them together. Wherever the shared protocol writes `<bot-label>`, substitute `bot/enhancement-fixer`. Wherever it writes `<candidate-labels>`, substitute the three labels under "Selection". Unlike the other workflows here, those two sets are **different**, because a person filed every issue this one works on.

- **Bot label**: `bot/enhancement-fixer`
- **Branch prefix**: `enhancement/` — pull request on any other branch is rejected before it opens
- **Lessons file**: `.github/agents/lessons/enhancements.md`
- **Budgets**: at most **two** open pull requests carrying the bot label at a time, **four** comments — shared between declines and the rebase notices in "Keeping open pull requests mergeable"

No issue budget: this workflow files no issues.

The lessons file records issues that read as trivial and were not, and why. It binds this run as hard as this section. Read it before selecting, not after.

## Context

- **Repository**: ${{ github.repository }}
- **Triggered by**: @${{ github.actor }}
- **Commit**: run `git rev-parse --short HEAD` in the workspace, quote the result. Never describe the commit any other way

## Selection

Drain in order, stopping as soon as the pull request budget is spent. Earlier label beats later one, however good the later candidate looks.

1. **`bot/enhancement-fixer/ready`** — a person nominated this issue for exactly this workflow. First, and the only source carrying an explicit instruction
2. **`good-first-issue`** — curated small and self-contained by whoever applied it
3. **`small-scope (mixin)`** — scoped small, not necessarily specified; expect a higher rejection rate

**The issue that triggered this run**, on a label event, is `${{ github.event.issue.number }}`. On a scheduled or dispatched run there is no triggering issue and that renders as nothing at all — empty means "none", not a number you failed to read. Where there is one, consider it first, then continue down the list while the budget has room.

Then apply the discards in "Selecting from the backlog": open pull request already touching the same files, lessons entry ruling it out, duplicates.

**A nomination is not a scope decision.** The label says a person wants this fixed automatically; the gate below says whether it can be. An issue can carry `bot/enhancement-fixer/ready` and still fail the gate, and then the answer is a comment saying so — not an attempt.

## The scope gate

A candidate lands squarely in one of these four categories. "Roughly like category 2" is a decline.

1. **Text or i18n** — user-facing strings live in `shell/assets/translations/en-us.yaml`. Adding or changing one means editing that file and referencing the key, never inlining a literal into a template. A string also in `zh-hans.yaml` is not yours to translate: change `en-us.yaml`, say in the body which other locale files now carry a stale copy
2. **Old markup replaced with a new component** — the replacement must **already exist** and **already be used elsewhere**. Writing the new component is not this category; it is a decline. Find its existing call sites first, match how they pass props, slots and events
3. **Colour changes** — through the SCSS variables in `shell/assets/styles/`, never a hardcoded hex. Colour with no variable is a decline: adding one is a design-system change. Verify in **both** light and dark mode, say in the body that you did
4. **Extending an established pattern to more cases** — something the repository already does, done somewhere it is not yet done. Qualifies only when **all four** hold:
   - repository holds **at least two** worked examples. Two, not one: with one there is no telling which details are the pattern and which are that case; two show what varies
   - new case is a transposition of those examples, not a design — same file shape, same base class or composable, same call sites, resource or route swapped
   - what it contains is derivable from the thing itself: its detail page, list columns, model getters, schema. Partly underivable, you may still proceed — but the body states exactly what you inferred and what from, and the pull request stays draft
   - needs no new component, no new API call, no new store module, no new dependency

   The body cites **both** examples you copied from, by `file:line`. A category 4 pull request that does not name them has not established the pattern exists, and reviewing it means doing that work again.

### Never a candidate

Whatever the category, whoever nominated it:

- **Specification exists only as a Figma link or image.** You can read neither. A body that is a screenshot and a link has not told you what to build. Exception: a category 4 issue satisfying its four conditions *independently* of the missing specification — where the pattern determines the answer, the picture was only illustrating it
- Anything needing a backend, API, schema or database migration change
- Anything adding a dependency
- Anything whose diff would exceed roughly **200 lines** or **10 files**. Estimate before starting, stop if the real change overruns it
- Anything a lessons entry rules out
- Anything an open pull request already touches

"Blocked", "in review" or "specs pending" is **not** automatically out. Read what is actually missing. A missing specification disqualifies when the change depends on it, and is irrelevant when an established pattern already determines the answer.

### Declining

A decline is a real outcome, often the correct one. Comment on the issue with:

- Which category it came closest to, and the specific condition it failed
- What would make it a candidate — the variable that would have to exist, the second example that would have to be written, the specification that would have to be in text

Then record it in the lessons file so later runs do not re-select it. Never attempt a partial fix, never open a draft pull request to "start the conversation": an unreviewable pull request costs a reviewer more than a comment does.

The label deliberately stays — this workflow has no permission to remove it. Whether a declined nomination stands is a person's call, and a bot silently un-nominating an issue hides the disagreement.

## Evidence

Every category above changes what a user sees, so unlike the other workflows here the evidence path in "Capturing UI evidence" is **not conditional**. Every pull request carries:

- A **before and after** pair per affected screen. Before is captured from base branch state — take it before the change, never after, never reconstructed from the issue's own screenshots
- **Dark mode as well as light** for any category 3 change, and for any change touching an `.scss` file at all

A pull request with no evidence is not "pending screenshots"; it is one that should not have been opened.

## What the pull request must say

On top of the shared template, the Re-verification section here carries:

- **Category** — which of the four, one line, plus the condition closest to failing
- **Prior art** — category 2: existing call sites of the replacement component. Category 4: the two worked examples, by `file:line`. Not required for 1 and 3
- **What was inferred** — anything not stated in the issue and not determined by prior art, and where the answer came from. "Nothing — the issue specified the change completely" is the expected answer for 1 and 3
- **Size** — files and lines changed against the ~200/~10 ceiling

**Objective**: turn well-specified small work into reviewable pull requests, and badly-specified small work into a clear statement of what is missing. A run succeeds doing either honestly. Attempting a fix of an issue that failed the gate is the one outcome worse than doing nothing.
