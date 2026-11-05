# Agent guidance shipped with the creator

`files/` is the single source of truth for the Rancher UI Extension guidance that
`@rancher/create-extension` drops into a scaffolded extension. It is written in
skill form - `SKILL.md` with frontmatter, and three reference documents sitting
next to it as siblings.

`init` generates two output shapes from those four files. The guidance is only
maintained once, here, in skill form; everything else is derived at scaffold time.

## Output shapes

### Agents - the default

```
my-app/
├── AGENTS.md                           SKILL.md, frontmatter stripped, links rewritten
├── CLAUDE.md                           @AGENTS.md
├── GEMINI.md                           @./AGENTS.md
├── GPT.md                              a link to AGENTS.md
└── .rancher-extension-docs/
    ├── rancher-ui-components.md
    ├── rancher-ui-patterns.md
    └── rancher-ui-styling.md
```

The guidance lives in `AGENTS.md` alone. The other three are pointers, for the
agents that look for a file named after themselves. Claude Code and Gemini CLI
both inline an `@` reference, Gemini wanting the leading `./`. Codex reads
`AGENTS.md` directly and has no import syntax, so `GPT.md` is a signpost rather
than a directive - it only gets read at all if someone lists it in
`project_doc_fallback_filenames`.

```sh
npm init @rancher/extension@latest my-ext            # part of the scaffold
npm init @rancher/extension@latest -- --agents       # into an existing folder
npm init @rancher/extension@latest my-ext -- --skip-agents   # opt out
```

### Skill

```
rancher-ui-extension/
├── .claude-plugin/
│   └── plugin.json                     metadata only; version tracks the creator
├── SKILL.md
├── rancher-ui-components.md
├── rancher-ui-patterns.md
└── rancher-ui-styling.md
```

```sh
npm init @rancher/extension@latest -- --skill              # into an existing folder
npm init @rancher/extension@latest my-ext -- --skill       # instead of AGENTS.md
```

Copy the folder into a skills directory - `.claude/skills/` for a single project,
`~/.claude/skills/` to have it everywhere.

`plugin.json` also makes it a Claude Code plugin, so it can be loaded for one
session with `claude --plugin-dir ./rancher-ui-extension` or listed in a
marketplace. A plugin with `SKILL.md` at its root, no `skills/` folder and no
`skills` key loads as a single skill, which is why the manifest carries metadata
and nothing else. Check it with `claude plugin validate ./rancher-ui-extension`
after any edit.

## What the transform does

The reference documents are siblings of each other in both shapes, so their
cross references survive untouched. Only two things move:

| | Agents | Skill |
|---|---|---|
| Frontmatter on the core file | stripped | kept |
| ``` `rancher-ui-*.md` ``` in the core file | prefixed with `.rancher-extension-docs/` | unchanged |
| ``` `SKILL.md` ``` in the reference files | rewritten to `AGENTS.md` | unchanged |
| Sentences calling the document a skill | reworded | unchanged |

## Editing the guidance

- Edit the files in `files/` and nothing else. Never hand-edit a generated
  `AGENTS.md` - the next scaffold will not carry the change.
- Reference a sibling document by bare filename in backticks
  (`` `rancher-ui-styling.md` ``), never with a path. The transform keys off the
  bare filename, and a path would be wrong in one of the two shapes.
- Reference the core document as `` `SKILL.md` `` in backticks, for the same reason.
- Adding a new reference document means adding it to `REFERENCE_FILES` in `init`.
- `AGENTS.md` is around 38 KB. Codex truncates a project doc at
  `project_doc_max_bytes`, 32 KiB by default, so anything added to the end of
  `SKILL.md` is the first thing Codex loses. Keep the ordering such that the
  important material is early.
- The "is this a skill or a file" rewrites in `init` are an explicit list of
  phrases, not a blanket search for the word. Reword one of those sentences in
  `SKILL.md` and the matching entry in `init` needs the same edit, or the
  generated `AGENTS.md` will still describe itself as a skill.
