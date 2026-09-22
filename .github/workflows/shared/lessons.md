## Lessons protocol

Every run that gets surprised should leave the next run better equipped. This workflow keeps a lessons file under `.github/agents/lessons/`; the workflow-specific section below names it.

### Read it first

**Before anything else**, read the lessons file. If it does not exist, note that and continue. Everything in it binds this run with the same force as the checks in this prompt — the entries exist precisely because following the prompt alone still produced a wrong answer.

### What qualifies as a lesson

- A mechanism this prompt does not describe that made the analysis wrong
- A search idiom that returned a misleading result: a command that silently matched nothing, a form the search missed, a name collision that hid the real attribution
- A repository convention that changes what a result means
- An open issue whose stated evidence did not reproduce, along with what the original analysis missed
- A change that broke `yarn lint` or `yarn test:ci` in a way the analysis did not predict

### What does not qualify

- A restatement of a rule already in this prompt. An entry earns its place only if following this prompt as written would still have produced the wrong answer
- A one-off observation about a specific file with no general rule behind it
- Anything you did not actually run into on this run. Do not speculate about failure modes
- A problem with the workflow itself — a missing dependency, a wrong runtime version, a gate that will not start. Report that in the run summary and move on

**Write the entry repository-agnostically.** Describe the pattern, not where it was filed — never name a repository or a fork, and do not cite issue numbers. The file travels with the workflow, so a number that resolves somewhere else is worse than no reference at all.

**Resembling an existing entry is not the same as being covered by it.** Before dismissing something as already recorded, read the entry you have in mind and check that its **Rule** would actually have caught this case. Two failures can share a symptom and still need different checks — if the existing rule would have let this one through, write a new entry and say in it how the two differ.

### How to record it

1. Append to the end of the `## Lessons` section of the file, using the exact entry format the file specifies under "Format for lessons": a dated `###` heading, then **Trigger**, **Rule** and **Command**
2. The **Rule** must be an instruction for a future run, not a description of what happened
3. The **Command** must be one you actually ran, with its real output — including, where it makes the point, the broken form alongside the working form
4. Below the entry cap, append and change nothing else. Never edit or delete an existing entry

### Keeping the file small

The file is read in full at the start of every run, so its length costs every run. Two limits.

**Per entry.** **Trigger** is one sentence. **Rule** at most two. **Command** at most fifteen lines: the broken form, the working form, and only the output lines that make the point. Never paste a whole run.

**Per file.** At most **twenty-five** entries under `## Lessons`. Count before appending.

At the cap, the run that wants to add an entry makes room first, in the same pull request:

1. Find two entries one rule would have caught — the same mechanism showing up as two symptoms. Entries about genuinely different mechanisms never qualify, however similar they read
2. Replace both with one entry, dated the later of the two, whose **Rule** covers both cases and whose **Command** keeps the more convincing of the two pairs
3. Consolidate exactly as many pairs as needed to get back under the cap. Never more
4. Name every consolidation in the pull request body's Lessons section: the headings folded together, the heading replacing them, one line on why one rule catches both

No two entries qualify: say so in the run summary, append anyway, leave the file one over the cap. Losing a lesson costs more than a long file. Consolidation is never the point of a run — only the price of adding an entry, reviewed like any other change in the pull request carrying it.

### Where the entry ships

A lessons change is not filed or committed separately. It is an ordinary edit in the working tree, picked up by the same `create-pull-request` safe output as everything else in the run — which is why the workflow's `allowed-files` lists the lessons file beside the product directories. There is no second mechanism.

Which pull request carries it, given the pull request budget:

- **This run is opening one or more pull requests** — include the lessons change in the **first** one and describe it in that body's Lessons section. A lessons entry never gets a pull request of its own while another is available to carry it, and it must not be duplicated across several
- **This run is opening no pull request** — write the entry into the file and open the pull request for it alone, keeping only the Lessons section of the body template

That Lessons section names each heading added, and each consolidation made under "Keeping the file small". A pull request that touches the lessons file and says nothing about it in the body is incomplete.

**Two open pull requests that both append to the lessons file will conflict**, because both add lines at the same end of the same section. Expected, and not yours to pre-empt: never rewrite your entry to dodge it, never push to a branch you did not open. The conflict surfaces as `dirty` in "Keeping the open pull requests mergeable" and resolves like any other conflict there — by comment, keeping both entries. Reordering or dropping one to ease the merge loses a lesson.

**The lessons file is the only file under `.github/` you may touch.** Never modify anything else there, and never a workflow or its lock file. Proposals to change this prompt go in the lessons file, which is read at the start of every run and therefore takes effect immediately without a workflow edit.
