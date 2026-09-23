---
# Shared component: how anything this workflow writes for a person must read.
#
# Import with:  imports: [shared/writing.md]
#
# Prose only, no frontmatter of its own. Applies to every workflow here that
# leaves text behind: issue comments, pull request bodies, run summaries.
---

## How to write what people read

Every piece of text this run leaves behind for a person follows the rules below. Issue comments, pull request bodies, run summaries — all of it.

These are not style preferences. A wall of undifferentiated text is the failure mode: a reviewer who cannot scan a comment does not read it, and an unread comment costs the same as no comment. Assume the reader is scanning, is interrupted, and is looking for one specific thing.

This section governs what you **write**. It does not govern how you read this prompt.

### Rules

- **Answer first.** Open with the conclusion — declined, fixed, blocked, and why in one line. Reasoning, evidence and background come after, and only where they change what the reader does
- **Three sentences to a paragraph, at most.** Anything longer becomes a list or gets split under a heading
- **One idea to a bullet.** A bullet that is itself a paragraph is not a bullet
- **Headings on anything past a few paragraphs**, so a reader can find the part that concerns them without reading the parts that do not
- **Bold the words that carry the decision**, never whole sentences. When everything is bold, nothing is
- **Paths, commands, identifiers and labels in backticks**, so they separate from prose at a glance
- **Anything the reader must do goes on its own line.** Never bury an action, a warning or a caveat mid-paragraph — it will be missed, and being technically present does not count
- **Tables for anything with repeating shape** — file lists, counts, per-item verdicts. Not prose describing a table

### Cut, do not pad

No preamble. No restating the issue back at the person who filed it. No summary of what you just said. A sentence carrying no new information is deleted, not softened.

Skip the pleasantries. "Thanks for the nomination" tells the reader nothing they did not know.

### Shorter is not thinner

**Never drop a technical detail, a caveat, a number or a negation to hit a length.** Losing a "not" or an "only" inverts the meaning, which is far worse than any length saved.

Where both the short answer and the full detail are needed, give both — structured so each is findable separately. Fewer words, same substance.
