# Dead Code Detector — Lessons

Written and maintained by the Dead Code Detector workflow
(`.github/workflows/dead-code-detector.md`), which reads this file at the start of every run.

## Unknown external usage

Exported code with **no consumer in this repository** and **no way to prove it has none elsewhere**.

Everything under `shell/` ships to npm as `@rancher/shell` (`shell/package.json` declares
`"files": ["**/*"]`), so any exported symbol there can be imported by an out-of-tree UI extension
as `@shell/...`. A repository-wide search cannot see those consumers. That makes "no importers
here" an unprovable negative, and unprovable negatives are not removal candidates.

This register is where they accumulate instead. Nothing on it is a bug, and nothing on it should
be deleted on the strength of being listed — the list exists so the question can be answered once,
by someone who knows the extension ecosystem, rather than re-asked by every run.

### Rules

- **Add** an entry when a run finds an exported symbol or a shipped file with zero in-repo
  consumers. Do not file it as a removal issue as well; this register replaces that issue
- **Never remove an entry because it is old.** Age is not evidence. An entry leaves only when
  someone establishes the answer: a consumer is found (record it, note the resolution), or a
  maintainer confirms nothing outside the repository uses it and the code is removed
- **Re-check on each pull request** that touches this file, and update what the check found. If an
  entry has gained an in-repo consumer since it was added, say so and resolve it — that is the
  outcome this register exists to catch
- **One row per exported symbol or file**, not per cluster. A cluster's members can resolve
  differently

### Register

| Added | Symbol or file | Exported as | In-repo consumers | Last re-checked | Notes |
| --- | --- | --- | --- | --- | --- |
| _(empty — the first run to find one adds it here)_ | | | | | |

## Format for lessons

Lessons are things that made live code look dead, or made an empty result look like proof.
Append them at the end, newest last, using exactly this shape:

```markdown
### YYYY-MM-DD — Short title

- **Trigger**: what was being analysed when this surfaced
- **Rule**: the check to run from now on, stated as an instruction
- **Command**: a command that demonstrates the rule, with its real output
```

Do not add an entry that merely restates a rule already in the detector prompt. An entry earns
its place only if following the prompt as written would still have produced the wrong answer.

A near-miss with an existing entry is still a new entry. Two failures that share a symptom but
need different checks belong in different entries — say in the **Rule** how the new one differs.

Say each thing once and point at it from anywhere else. If an entry refers to another one, name
it by its title and re-read that entry first to confirm it still says what you are claiming; a
pointer that has gone stale reads as verified and is not.

This file is about identifying dead code, and nothing else. Problems with the workflow itself —
a missing dependency, a wrong runtime version, a gate that will not start — do not belong here.
Describe the pattern, not where it was filed: never name a repository or a fork in an entry, and
do not cite issue numbers.

## Lessons

_(none recorded yet)_
