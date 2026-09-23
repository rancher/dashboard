## Remediation protocol

How an open issue becomes the pull request closing it: what may be picked up, how many at once, what must be proven before a line changes, what the body must say. Same protocol whoever filed the issue — earlier run of this workflow, or person.

Two labels run through it, both named in the workflow-specific section. Substitute literally:

- `<bot-label>` — label on pull requests **this workflow opens**. How it recognises its own work and counts the budget
- `<candidate-labels>` — label or labels whose open issues are candidates for fixing

May be the same label, may be different ones.

**A run never ends silently.** Produced nothing: call `noop`, one sentence why. No output is indistinguishable from a crash, and the workflow files a failure issue for it. Blocked is a legitimate result; not saying so is not.

### Pull request budget

Only so many pull requests carrying `<bot-label>` open at once; workflow-specific section states the number. First call of the run: `list_pull_requests` with `state: "open"`, keep the ones carrying `<bot-label>`.

Budget counts pull requests **open**, not opened by this run: two already open leaves room for one, not three.

- **Full** — open none, change no code. Queue of unreviewed pull requests is the backlog this shape exists to prevent. Spend the run on work costing no slot: re-checking open pull requests, commenting on candidates that do not hold up
- **Room left** — carry the free-slot count through the rest of the run

### Keeping open pull requests mergeable

Pull request behind its base blocks its own merge, and unreviewed goes stale fast — lines it touches get edited underneath it. Check open ones before opening anything new. For each, `pull_request_read` with `method: "get"`, read `mergeable` and `mergeable_state`:

- `clean` or `unstable` — nothing to do
- `behind` — needs only base branch merged in. Say so in the comment below; never rebase by hand
- `mergeable` `false`, or `dirty` — genuinely conflicts

Rebase needed: **never push to that branch.** Its patch was reviewed under the branch protections of the run that opened it, and re-driving it from here bypasses them. One comment instead, one `add-comment` slot, naming state and what has to happen:

```markdown
This pull request is `<mergeable_state>` against `<base branch>` as of <short sha>.

<For `behind`:> Merge the base branch in to bring it up to date; no content change is needed.
<For `dirty`:> It conflicts in <files, from `get_files`>. <One line on whether the change still applies against current code: re-run the check and say so.>
```

Re-check shows premise gone — someone made the change by hand, or the target code no longer exists — say that in the same comment and recommend closing. More useful than a rebase.

Each comment costs one `add-comment` slot: cap at the oldest three needing attention, note in the run summary if more were skipped.

### Selecting from the backlog

1. `list_issues` with `labels: ["<candidate-labels>"], state: "OPEN"`, then `issue_read` each for its body. Several candidate labels drain in the order the workflow-specific section gives
2. Discard any already covered by an open pull request. **`Closes`/`Fixes` links are not enough** — get changed files of every open pull request carrying `<bot-label>` with `pull_request_read` / `method: "get_files"`, discard any issue whose files overlap that set at all. Partial overlap counts: two pull requests touching one file conflict on merge
3. Discard anything a lessons entry rules out
4. Discard duplicates. Same thing gets filed several times in different words. Take the **oldest**, keep the numbers of its restatements — the fix resolves them all and the pull request must close them all
5. From what remains, order by how completely the issue specifies what it wants, then by blast radius, take as many as budget allows. Three-file change beats eighteen-file grab bag
6. Check what you took against itself. Two issues with overlapping file sets are one piece of work — merge into a single fix closing both, pull the next candidate into the free slot

**Re-verify from scratch.** Issue's own evidence does not count. "Result: no matches" proves nothing alone — the search producing it may have matched nothing because it was malformed. Re-run every applicable check against current code, plus a control search proving the command returns hits when hits exist. Code may also have changed since filing.

### Acting on a candidate

One candidate at a time, finished before the next starts — re-verify, change, gate, open pull request, move on. Half-finishing several delivers nothing. Timeout approaching: stop after the last completed pull request rather than leaving one unfinished.

**Confirmed** — fix it:

1. Make the change, and everything it transitively requires
2. Run `yarn lint` and `yarn test:ci`. Either fails: fix the fallout or abandon the change — never open a pull request on a failing gate. **A gate that could not run has not passed.** Errors on a missing dependency, a runtime version, anything other than your change: failed gate, open no pull request, say in the run summary which command failed and what it printed. Never reason about what the gate would have reported — running it is the point, because your reasoning is what is being checked
3. Touches UI: capture evidence — see "Capturing UI evidence"
4. Open the pull request on branch `<branch-prefix><issue-number>-<slug>`: prefix from this workflow's frontmatter, number of the issue this fixes, slug a short kebab-case name. Number not optional — `<branch-prefix>42-empty-state-copy`, never `<branch-prefix>empty-state-copy`. Name is used verbatim, so a typo is permanent and a collision with an existing branch overwrites it

   **Never guess the number.** It comes from a real issue you listed, never from adding one to the highest you saw: safe-outputs assigns numbers after this agent exits, so any prediction is a race you sometimes lose and the branch ends up carrying another issue's number. Where this workflow also files issues, a finding filed this same run has no number yet — write the literal `new` there, e.g. `<branch-prefix>new-<slug>`, never a guess

**Does not hold up** — open no pull request. Comment on the issue with the exact command or reading contradicting it, its output, and one line on what the original analysis missed or which gate the issue fails. Record it in the lessons file so later runs do not re-select it. Successful run, not a wasted one.

### Closing the issues a pull request resolves

- Never invent an issue number, never guess the next one
- Only GitHub's closing keywords auto-close. End the body with `Closes #N`, one line per **every** duplicate the same change resolves. Prose like "also resolves #A" leaves the issue open and it returns as a candidate later

Quote evidence once, where used: the body carries commands and output, the issue it closes is referenced by number rather than summarised back.

### Pull request body

**Start from this repository's own template.** Read `.github/pull_request_template.md` out of the workspace as you compose, reproduce it section for section: same headings, same order, HTML comments left in place. Never reconstruct it from this prompt or another pull request — the template is maintained by the repository and gains sections over time, and a body missing one reads as a body nobody filled in. Second reason to read the file: those comments are stripped out of this prompt before you see it, so a copy written here would be missing the guidance each section carries.

Fill every section, add the three marked **added**. They carry the evidence this workflow is judged on, and the template has nowhere to put them.

- **Summary** — template opens with `Fixes #`. Complete it with the issue number, then one sentence on what changed and why
- **Occurred changes and/or fixed issues** — file table
- **Technical notes summary** — what a reviewer would otherwise reverse-engineer from the diff: signature that had to change, barrel export re-pointed, test that moved rather than went
- **Areas or cases that should be tested** — what to exercise to be satisfied the change is safe. Name screens or commands; "regression test the app" is not an answer
- **Areas which could experience regressions** — what could still break, and why it was ruled out
- **Screenshot/Video** — the assets, or one line saying why there are none
- **Checklist** — tick only what this run genuinely satisfies, leave the rest unticked. Unticked box is a working signal that something needs a human; ticking one you did not satisfy hides that work. Several cannot be satisfied from inside a run at all — milestone, assigned reviewer, self review — and stay unticked

Bodies are read by people: plain English, not the compression this prompt uses. Every rule in "How to write what people read" applies to this body in full.

````markdown
### Summary
Fixes #N

[One sentence: what changed, and what the issue asked for.]

### Occurred changes and/or fixed issues

| File | Lines | Why |
| --- | --- | --- |
| `path/to/file.ext` | NN | [reason] |

Total: [N files, N lines, from `wc -l`]

### Technical notes summary

- [Anything in the diff a reviewer would not predict from the issue, and why it was necessary. Omit the section's bullets entirely if there is nothing.]

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

- [The screens, routes or commands that exercise what changed.]

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
