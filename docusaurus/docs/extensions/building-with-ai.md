# Building with AI

Every development app is scaffolded with guidance for AI coding agents working on
Rancher UI Extensions. If you use Claude Code, Codex, Gemini CLI, Cursor or
similar, your agent picks it up and writes extensions that look like the ones the
Rancher team writes - the right components, the right tokens, the right product
registration API, and a build that passes before it tells you it is done.

You do not have to do anything to get it. It is in the folder the creator
generates. This page covers what it contains, how to get it as a skill instead,
and how to add it to an app you already have.

## What ships

The guidance is one document plus three reference documents.

`AGENTS.md` is the guidance itself. The most useful part is the set of rules it
puts in front of the agent before it writes anything:

- **Documentation first.** The agent is told to fetch the relevant page from this
  site and check the [support matrix](./support-matrix.md) before using any API,
  rather than working from whatever it remembers about Rancher.
- **Product Registration API by default**, with the legacy DSL as a pre-2.15
  fallback. Agents trained on the shipped extensions reach for the DSL, because
  every public extension predates the new API.
- **Shell and Rancher components before custom ones**, checked against
  [Storybook](https://rancher.github.io/storybook/) first.
- **Operator guards and permission scoping** on screens that need them, so you
  don't get an empty table where a standard user should see a clear message.
- **TypeScript and the Composition API**, not the Options API that much of the
  older shell scaffolding still uses.
- **No build errors.** Lint and `yarn build-pkg` have to pass before the work is
  finished.

It also sizes its own process to the job. Scaffolding a new extension runs a full
discovery-to-summary pass; adding a table column goes straight to the edit. That
is deliberate: an agent that interviews you about navigation structure before
changing one line is worse than no guidance at all.

The reference documents are the detail the guidance points into:

| Document | What it covers |
| :- | :- |
| `rancher-ui-components.md` | The component library - props, best practices and anti-patterns for the shell and Rancher components, plus the security and dashboard primitives |
| `rancher-ui-patterns.md` | Compositions - list pages, edit forms, detail views and their mastheads, dialogs, overview and security dashboards |
| `rancher-ui-styling.md` | The design tokens - colour, the spacing scales and helper classes, radius, typography, the column grid, breakpoints, z-index |

These are a convenience layer, not a specification. Component props are verified
against [Storybook](https://rancher.github.io/storybook/) and the source, and
API behaviour against these docs. Where a snippet disagrees with the
documentation, the documentation wins.

## The default form: AGENTS.md

```sh
npm init @rancher/extension@latest my-app
```

```
my-app/
├── AGENTS.md                           the guidance
├── CLAUDE.md                           pointer to AGENTS.md
├── GEMINI.md                           pointer to AGENTS.md
├── GPT.md                              pointer to AGENTS.md
└── .rancher-extension-docs/
    ├── rancher-ui-components.md
    ├── rancher-ui-patterns.md
    └── rancher-ui-styling.md
```

[`AGENTS.md`](https://agents.md) is the convention most coding agents read without
being configured. The guidance lives there and only there; `CLAUDE.md`,
`GEMINI.md` and `GPT.md` point at it, so an agent looking for a file named after
itself finds one and you still have a single copy to keep up to date.

Commit all of it. It travels with the extension, so anyone who clones the
repository gets the same guidance with no setup.

:::note

**Using Codex.** `AGENTS.md` is around 38 KB, and Codex truncates a project
document at `project_doc_max_bytes`, which defaults to 32 KiB. Left alone, Codex
reads most of the guidance but drops the last few KB, which is where the summary
template and the table of common pitfalls sit. To get all of it, raise the limit
in `~/.codex/config.toml`:

```toml
project_doc_max_bytes = 65536
```

Codex looks for `AGENTS.md` and not `GPT.md`. The `GPT.md` file is a pointer for
anyone who opens it, and for tools that can be told to read it; in Codex that
means adding it to `project_doc_fallback_filenames`. You do not need to do
anything with it for Codex to pick up the guidance.

:::

## As a skill

A skill is loaded when it is relevant rather than sitting in context for the
whole session. If you work across several repositories, or you would rather not
spend context on extension guidance while debugging something unrelated, take
this form instead:

```sh
npm init @rancher/extension@latest my-app -- --skill
```

```
rancher-ui-extension/
├── .claude-plugin/
│   └── plugin.json
├── SKILL.md
├── rancher-ui-components.md
├── rancher-ui-patterns.md
└── rancher-ui-styling.md
```

Copy the folder into a skills directory - `.claude/skills/` for one project,
`~/.claude/skills/` to have it on every project on your machine:

```sh
cp -r rancher-ui-extension ~/.claude/skills/
```

It triggers on its own when a task looks like extension work, and you can invoke
it directly with `/rancher-ui-extension`.

The folder is also a Claude Code plugin, so you can try it for a single session
without copying anything:

```sh
claude --plugin-dir ./rancher-ui-extension
```

Both forms carry the same content. The cross references between the files are
rewritten to match whichever layout you asked for, so nothing points at a file
that isn't there.

## Adding it to an app you already have

Run either flag from the root of an existing development app, with no extension
name:

```sh
npm init @rancher/extension@latest -- --agents
npm init @rancher/extension@latest -- --skill
```

Nothing is ever overwritten. Files that already exist are reported as skipped and
left alone, so it is safe to re-run and your edits are never clobbered.

That also means **refreshing is a delete-then-regenerate**. To pick up a newer
version of the guidance, remove the files first:

```sh
rm -rf AGENTS.md CLAUDE.md GEMINI.md GPT.md .rancher-extension-docs
npm init @rancher/extension@latest -- --agents
```

## Opting out

```sh
npm init @rancher/extension@latest my-app -- --skip-agents
```

No `AGENTS.md`, no pointer files, no reference documents.

## What it does not do

The guidance does not replace this documentation - it is written to send the
agent here, and it says so to the agent in its own first rule. Rancher's
extension APIs change between releases and a file checked into your repository
does not. Treat anything it asserts about an API as something to verify against
the relevant page and the [support matrix](./support-matrix.md), the same way you
would treat a snippet from a blog post.

It also does not review itself. An agent following it still produces code you
need to read, and the quality gates it runs - lint, type check, `yarn build-pkg`
- catch broken builds, not wrong behaviour.
