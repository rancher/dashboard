## Reporting protocol

Every finding gets an issue. Every issue that can be resolved gets a pull request that resolves it. The issue is the record, the pull request is the fix, and one without the other is half the job.

Each run does **both**, in this order:

1. **Remediate the backlog** — open issues carrying this workflow's bot label from earlier runs. Re-verify each from scratch, then either fix it and open the pull request that closes it, or comment with the disproof where re-verification kills it
2. **Find what is new** — look for what nobody has reported yet, and file an issue per verified finding. Where the pull request budget still has room after step 1, fix it this run too and open the pull request alongside its issue

Neither phase is a fallback for the other. A full backlog does not excuse skipping detection. An empty backlog does not turn detection into the whole run.

**A run must never end silently.** Produced nothing: call the `noop` tool and say in one sentence why. No output at all is indistinguishable from a crash, and the workflow files a failure issue for it. Being blocked is a legitimate result; not saying so is not.

### The pull request budget

Only so many pull requests carrying this workflow's bot label may be open at a time. The workflow-specific section below states the number and the label — substitute both literally wherever this protocol writes `<bot-label>`.

First call of the run: `list_pull_requests` with `state: "open"`, then keep the ones carrying `<bot-label>`.

The budget counts pull requests **open**, not pull requests opened by this run. Two already open leaves room for one more, not for three.

- **Full** — open no pull request and change no code. A queue of unreviewed pull requests is exactly the backlog this shape exists to prevent. Spend the run on refutation and on filing issues, which cost no slot
- **Room left** — carry the free-slot count through the rest of the run. Slots remediation does not use are available to same-run fixes

### Keeping the open pull requests mergeable

A pull request that has fallen behind its base branch blocks its own merge. A dead-code removal goes stale faster than most, because the lines it deletes get edited underneath it.

So before opening anything new, check what is already open. For each pull request from the list above, call `pull_request_read` with `method: "get"` and read `mergeable` and `mergeable_state`:

- `clean` or `unstable` — nothing to do
- `behind` — needs only the base branch merged in
- `mergeable: false`, or `dirty` — it genuinely conflicts

**Never push to a branch you did not open.** Its patch was reviewed under the branch protections of the run that opened it, and re-driving it from here bypasses them. That applies to `behind` too — do not rebase it by hand.

Comment instead, one `add-comment` slot each, naming the state and what has to happen:

```markdown
This pull request is `<mergeable_state>` against `<base branch>` as of <short sha>.

<For `behind`:> Merge the base branch in to bring it up to date; no content change is needed.
<For `dirty`:> It conflicts in <files, from `get_files`>. <One line on whether the finding still holds against current code: re-run the reference check and say so.>
```

Re-checking a conflicted pull request may show its finding no longer holds — the code it deletes has since been referenced, or someone else already deleted it. Say that in the same comment and recommend closing it. More useful than a rebase.

Each comment costs an `add-comment` slot. Cap this at the oldest three needing attention, and name any you skipped in the run summary.

### Selecting from the backlog

1. List open issues: `list_issues` with `labels: ["<bot-label>"], state: "OPEN"`, then `issue_read` each one for its body. `list_issues` capitalises `state`, `list_pull_requests` does not — see "Reading GitHub state"
2. Discard any already covered by an open pull request. **A `Closes`/`Fixes` link is not enough to go on** — get the changed files of every open pull request carrying the label with `pull_request_read` / `method: "get_files"`, and discard any issue whose files overlap that set at all. Partial overlap counts: two pull requests touching some of the same files conflict on merge
3. Discard anything a lessons entry has already ruled out
4. Discard duplicates. The same finding is routinely filed several times in different words. Keep the **oldest** issue describing it, and keep the numbers of its restatements — one fix resolves them all, and the pull request has to close them all
5. Order what remains by stated confidence, then by blast radius. Take as many as the budget allows. A three-file finding is a better candidate than an eighteen-file grab bag
6. Check the ones you took against each other. Two issues whose file sets overlap are one finding — merge them into a single fix closing both, and pull the next candidate up into the free slot

**Re-verify from scratch. The issue's own evidence does not count.** "Result: no matches" proves nothing on its own: the search may have matched nothing because it was malformed. The code may also have changed since the issue was filed.

Re-run every applicable check against the code as it exists now, including a control search proving the command returns hits when hits exist.

### Acting on a candidate

One candidate at a time, finished before the next starts: re-verify, change, gate, open the pull request, move on. A run that half-finishes several delivers nothing. With the timeout approaching, stop after the last completed pull request rather than leaving one unfinished.

**Confirmed** — fix it:

1. Make the change, and everything it transitively requires
2. Run `yarn lint` and `yarn test:ci`. Either fails: fix the fallout or abandon the change. Never open a pull request with a failing gate

   **A gate that could not run has not passed.** A command erroring on a missing dependency, a runtime version, or anything other than your change is a failed gate. Open no pull request, and name in the run summary which command failed and what it printed. Never reason about what the gate would have said — your reasoning is the thing it exists to check
3. Change touches the UI: capture evidence, see "Capturing UI evidence"
4. Open the pull request on a branch named `<branch-prefix><issue-number>-<slug>`. The prefix comes from this workflow's frontmatter, the number is the issue this fixes, and the slug is a short kebab-case name for the finding: `dead-code/75-poller-sequential`, not `dead-code/poller-sequential`

   The name is used verbatim. A typo is permanent, and a name colliding with an existing branch overwrites it.

   A finding this run both filed and fixed has no number yet. Use the literal `new` in that position, `<branch-prefix>new-<slug>`.

   **Never guess the number.** It comes from a real issue you listed, never from adding one to the highest you saw. Safe outputs assign numbers after this agent exits, so a prediction is a race you will sometimes lose — and the branch then carries another issue's number. No listed number in hand means the answer is `new`.

**Refuted, or no longer accurate** — open no pull request. Comment on the issue with the exact command that found the contradicting evidence, its output, and one line on what the original analysis missed. Record the refutation in the lessons file so later runs do not re-select it.

That is a successful run, not a wasted one.

### Filing a new issue

**Check what has already been reported first.** This workflow runs daily against a codebase that changes slowly, so most of what you find on any run has already been filed — and an issue nobody has acted on is still open, still accurate, still waiting.

List the open issues carrying the bot label, read their titles and bodies, then for each finding:

- **Already covered** — do not file it again. Partial overlap counts: an open issue listing three of your four files is the same finding
- **Covered but wrong or incomplete** — do not file a corrected duplicate. Comment on the existing issue with the correction, or refute it
- **Genuinely new** — file it, naming in the body which existing issues you checked against

One issue per distinct finding. Never bundle unrelated findings into one. Keep the run to the most significant findings the issue budget allows — the workflow-specific section below states the number.

### Linking an issue to the pull request that fixes it

Both `create_issue` and `create_pull_request` accept a `temporary_id`. Set one on the issue, then write `#aw_<that id>` anywhere in the pull request body. It is replaced with the real issue number once both exist — in the same run, and in both directions.

```text
create_issue          → temporary_id: "dc1"
create_pull_request   → body contains "Closes #aw_dc1"
```

Substitution happens before the body is posted, so `Closes #aw_dc1` becomes a real `Closes #123` and GitHub auto-closes the issue on merge. Use it for every same-run pair.

**Call `create_pull_request` before `create_issue`.**

Substitution itself is order-independent — `#aw_<id>` resolves whichever way round the two are emitted — but the runtime is not. A watchdog starts counting from the run's first safe output and kills the agent after a short idle period. `create_pull_request` is far the slower call: it stages a branch and pushes it, silently. Emitted second, it is the one that gets killed, leaving its issue advertising a pull request that does not exist. Emitted first, it finishes before the clock starts.

Several pairs in one run: every pull request first, then the issues, then the comments. Cheap calls last.

Rules:

- Never invent an issue number, and never guess at the next one. Use the real number of a backlog issue, or use `#aw_<id>`
- Only GitHub's own closing keywords auto-close. End the pull request body with `Closes #N` (or `Closes #aw_<id>`), plus one more such line for **every** duplicate issue the same change resolves. Prose like "also resolves #A" leaves that issue open, and it comes back as a candidate on a later run
- **Never pair a finding you could not fix.** A change that failed a gate, exceeded the budget, or turned out larger than the issue describes: file the issue alone, and say in it why no pull request came with it. An issue claiming a fix that does not exist is worse than an issue on its own
- **Write the "Fixed by" line only after the pull request call has returned.** The pull request goes first, so you always know before composing the issue whether it exists. `create_pull_request` errored, or was never called: the issue's Fix section takes the "no pull request accompanies this issue" form. Never `#aw_<id>` pointing at a call that did not succeed — an unresolved `#aw_` marker in a posted body is what that mistake looks like from outside

Quote evidence once, where it is used. The pull request body carries the commands and their output; the issue it closes is referenced by number, not summarised back.

### Issue body

````markdown
# <emoji> <Finding title>

*Analysis of commit `<output of git rev-parse --short HEAD>`*

## Fix

[If this same run opened the pull request:]
Fixed by the pull request #aw_<pull request temporary id> from this same run.

[Otherwise, the reason there is none:]
*No pull request accompanies this issue: [budget was full / confidence below the threshold / too large to fix safely in one run / a lint, test or build gate failed — quote it]. A later run picks this up from the backlog.*

## Summary

[Brief overview of this specific finding]

## Details

- **Confidence**: [level, and the provenance shape that sets it]
- **Severity**: High/Medium/Low
- **Locations**:
  - `path/to/file.ext` (lines X-Y) — [what is there]

## Verification evidence

- Command: `[exact command]` → [result]
- Control: `[the same command against something known to be live]` → [hit count, proving the command works]
- Existing issues checked: [numbers compared against, and why this finding is not among them]
- [Whatever else this workflow's own verification section requires]

## Impact

- [What fixing this improves, with counted rather than estimated numbers]

## Recommended fix

1. [Concrete step]
````

### Pull request body

**Start from this repository's own pull request template.** Read `.github/pull_request_template.md` out of the workspace as you compose the body, and reproduce it section for section: same headings, same order, HTML comments under each one left in place.

**Never reconstruct it from this prompt or from another pull request.** The template is maintained by the repository and gains sections over time, and a body missing one reads as a body nobody filled in. The comments are also stripped out of this prompt before you see it, so a copy written here would be missing exactly the guidance each section carries.

Fill every section, and add the three marked **added** below. Those carry the evidence this workflow is judged on, and the template has nowhere to put them.

- **Summary** — the template opens with `Fixes #`. Complete it with the issue number, then one sentence on what is being deleted and what makes it dead
- **Occurred changes and/or fixed issues** — the file table
- **Technical notes summary** — what a reviewer would otherwise reverse-engineer from the diff: a deletion that forced a signature change, a barrel export that had to be re-pointed, a test that moved rather than went
- **Areas or cases that should be tested** — what to exercise to be satisfied the deletion is safe. Name the screens or commands. "Regression test the app" is not an answer
- **Areas which could experience regressions** — what could still break, and why it was ruled out
- **Screenshot/Video** — the assets, or one line on why there are none
- **Checklist** — tick a box **only** where this run genuinely satisfies it. An unticked box is a working signal that something still needs a person; ticking one you did not satisfy hides that work instead of reporting it. Several cannot be satisfied from inside a run at all — a milestone, an assigned reviewer, a self review — and those stay unticked

````markdown
### Summary
Fixes #N

[One sentence: what is deleted, and what makes it dead.]

### Occurred changes and/or fixed issues

| File | Lines | Why |
| --- | --- | --- |
| `path/to/file.ext` | NN | [reason] |

Total: [N files, N lines, from `wc -l`]

### Technical notes summary

- [Anything in the diff that is not a plain deletion, and why it was necessary. Omit the section's bullets entirely if every change is a straight removal.]

### Re-verification (added)

The evidence in the issue was not reused. Every check below was re-run against the code as of this branch.

- Command: `[exact command]` → [result]
- Control: `[same command against something known to be live]` → [hit count]
- [Whatever else this workflow's own verification section requires]

### Gates (added)

Both must have actually executed. "Expected to pass", "cannot run" or "no source file was modified so nothing can break" are not results, and a pull request carrying one of them should not have been opened.

- `yarn lint` — [pass, or the failure output]
- `yarn test:ci` — [pass, with the suite/test counts it printed]

### Lessons (added)

[Omit this section if the run learned nothing. Otherwise the entries appended to the lessons file, one line each on what misled the run and the rule now recorded.]

### Areas or cases that should be tested

- [The screens, routes or commands that exercise what was removed.]

### Areas which could experience regressions

- [What could still break, and why it was ruled out]

### Screenshot/Video

[When the change touches the UI, per "Capturing UI evidence":]

![<what the screen shows>](<png url from upload_asset>)

[Walkthrough recording (webm)](<webm url from upload_asset>)

- Screens walked: [each screen, and what changed on it]
- Console: `playwright-cli console error` on each of the above → [no errors]

[When it does not touch the UI:] N/A — the change is confined to [paths], which render nothing.

[When it touches the UI but no video exists:] No recording. [The dev build did not finish inside the timeout / the recording could not be produced — say which, and quote what was printed.] A screenshot is attached instead.

### Checklist

[Every box from the template, in the template's order and wording. Ticked where this run satisfies the item, left unticked where it does not.]

Closes #N
````
