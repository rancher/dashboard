## Reporting protocol

Every finding gets an issue, and every issue that can be resolved gets a pull request that resolves it. The issue is the record; the pull request is the fix. A run that produces one without the other has done half the job.

Each run does **both** of these, in this order:

1. **Remediate the backlog** — take the open issues carrying this workflow's bot label that earlier runs filed, re-verify each from scratch, and either fix it and open a pull request that closes the issue, or, if re-verification disproves it, comment on it with the disproof
2. **Find what is new** — look for what nobody has reported yet, and file an issue for each verified finding. Where the pull request budget still has room after step 1, fix the finding on this run too and open the pull request alongside its issue

Neither phase is a fallback for the other. A full backlog does not excuse skipping detection, and an empty backlog does not turn detection into the whole run.

**A run must never end silently.** If neither phase produced anything, call the `noop` tool and say in one sentence why. Ending with no output at all is indistinguishable from a crash, and the workflow files a failure issue for it. Being blocked is a legitimate result; not saying so is not.

### The pull request budget

Only so many pull requests carrying this workflow's bot label may be open at a time. The workflow-specific section below states the number and the label; substitute both literally wherever this protocol writes `<bot-label>`. List what is open before doing anything else:

```bash
gh pr list --label <bot-label> --state open --json number,title,files
```

The budget counts pull requests **open**, not pull requests opened by this run: two already open leaves room for one more, not for three.

- **The budget is full** — open no pull request and change no code. A queue of unreviewed pull requests is exactly the backlog this shape exists to prevent. Spend the run on refutation and on filing issues, which costs no slot
- **There is room** — carry the number of free slots through the rest of the run. Slots remediation does not use are available to same-run fixes

### Selecting from the backlog

1. List open issues with `gh issue list --label <bot-label> --state open --json number,title,body`
2. Discard any already covered by an open pull request. **Checking for a `Closes`/`Fixes` link is not enough** — list the changed files of every open pull request carrying the label with `gh pr diff <n> --name-only`, and discard any issue whose files overlap that set at all. A partial overlap counts: two pull requests touching some of the same files will conflict on merge
3. Discard anything a lessons entry has already ruled out
4. Discard the duplicates. A finding is routinely filed several times over, in different words. Pick the **oldest** issue describing it, and keep the numbers of its restatements — the fix resolves them all and the pull request has to close them all
5. From what remains, order by stated confidence and then by blast radius, and take as many as the budget allows. A three-file finding is a better candidate than an eighteen-file grab bag
6. Check the ones you took against each other. Two issues whose file sets overlap are one finding, not two — merge them into a single fix that closes both, and pull the next candidate up to fill the slot

**Re-verify from scratch.** The issue's own evidence does not count. A "Result: no matches" proves nothing on its own — the search that produced it may have matched nothing because it was malformed. Re-run every applicable check against the code as it exists now, including a control search proving the command returns hits when hits exist. The code may also have changed since the issue was filed.

### Acting on a candidate

Work through candidates one at a time and finish each before starting the next — re-verify, change, gate, open the pull request, then move on. A run that half-finishes several delivers nothing. If the timeout is approaching, stop after the last completed pull request rather than leaving one unfinished.

**Confirmed** — fix it:

1. Make the change, and everything it transitively requires
2. Run `yarn lint` and `yarn test:ci`. If either fails, fix the fallout or abandon the change — never open a pull request with a failing gate. **A gate that could not run has not passed.** If either command errors on a missing dependency, a runtime version, or anything other than your change, that is a failed gate: open no pull request, and say in the run summary exactly which command failed and what it printed. Do not reason about what the gate would have reported — the whole point of running it is that your reasoning is what is being checked
3. If the change touches the UI, capture evidence — see "Capturing UI evidence"
4. Open the pull request on a branch named `<branch-prefix><issue-number>-<slug>`, where the prefix is the one declared in this workflow's frontmatter and the slug is a short kebab-case name for the finding. For a finding this run both filed and fixed, no number exists yet — use the literal `new` in that position, e.g. `<branch-prefix>new-<slug>`

**Refuted, or no longer accurate** — open no pull request. Comment on the issue with the exact command that found the contradicting evidence, its output, and a one-line statement of what the original analysis missed. Then record the refutation in the lessons file so later runs do not re-select it. This is a successful run, not a wasted one.

### Filing a new issue

**Check what has already been reported first.** This workflow runs daily against a codebase that changes slowly, so on any given run most of what you find has already been filed — and an issue nobody has acted on yet is still open, still accurate, and still waiting. List the open issues carrying the bot label and read their titles and bodies. Then, for each finding:

- **Already covered** — do not file it again. Partial overlap counts: if an open issue lists three of your four files, that is the same finding, not a new one
- **Covered but wrong or incomplete** — do not file a corrected duplicate. Comment on the existing issue with the correction, or refute it
- **Genuinely new** — file it, and name in the body which existing issues you checked against

File one issue per distinct finding; never bundle unrelated findings into one. Limit the run to the most significant findings the issue budget allows — the workflow-specific section below states it.

### Linking an issue to the pull request that fixes it

Both `create_issue` and `create_pull_request` accept a `temporary_id`. Set one on the issue, then write `#aw_<that id>` anywhere in the pull request body: it is replaced with the real issue number once both exist. This works in the same run, and it works in both directions.

```text
create_issue          → temporary_id: "dc1"
create_pull_request   → body contains "Closes #aw_dc1"
```

The substitution happens before the body is posted, so `Closes #aw_dc1` becomes a real `Closes #123` and GitHub auto-closes the issue on merge. Use it for every same-run pair.

Rules:

- Never invent an issue number and never guess at the next one. Either use the real number of a backlog issue, or use `#aw_<id>`
- Only GitHub's own closing keywords auto-close. End the pull request body with `Closes #N` (or `Closes #aw_<id>`) and one more such line for **every** duplicate issue the same change resolves. Prose like "also resolves #A" leaves the issue open and it returns as a candidate on a later run
- **Do not pair a finding you could not fix.** If the change failed a gate, exceeded the budget, or turned out larger than the issue describes, file the issue alone and say in it why no pull request came with it. An issue claiming a fix that does not exist is worse than an issue on its own

Evidence is quoted once, where it is used: the pull request body carries the commands and their output, and the issue it closes is referenced by number rather than summarised back.

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

````markdown
# <emoji> <What this changes>

Resolves #N, after re-verifying every item against the current code.

## What changed

| File | Lines | Why |
| --- | --- | --- |
| `path/to/file.ext` | NN | [reason] |

Total: [N files, N lines, from `wc -l`]

## Re-verification

The evidence in the issue was not reused. Every check below was re-run against the code as of this branch.

- Command: `[exact command]` → [result]
- Control: `[same command against something known to be live]` → [hit count]
- [Whatever else this workflow's own verification section requires]

## Gates

Both must have actually executed. "Expected to pass", "cannot run" or "no source file was modified so nothing can break" are not results, and a pull request carrying one of them should not have been opened.

- `yarn lint` — [pass, or the failure output]
- `yarn test:ci` — [pass, with the suite/test counts it printed]

## Evidence

[When the change touches the UI, per "Capturing UI evidence":]

![<what the screen shows>](<png url from upload_asset>)

[Walkthrough recording (webm)](<webm url from upload_asset>)

- Screens walked: [each screen, and what changed on it]
- Console: `playwright-cli console error` on each of the above → [no errors]

[When it does not touch the UI:] Not applicable — the change is confined to [paths], which render nothing.

[When it touches the UI but no video exists:] No recording. [The dev build did not finish inside the timeout / the recording could not be produced — say which, and quote what was printed.] A screenshot is attached instead.

## Risk

- [What could still break, and why it was ruled out]

## Lessons

[Omit if the run learned nothing. Otherwise the entries appended to the lessons file, one line each on what misled the run and the rule now recorded.]

Closes #N
````
