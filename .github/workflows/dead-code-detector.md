---
name: Dead Code Detector
description: Identifies dead and unused code across the codebase and suggests safe removal opportunities
on:
  schedule: daily
  # Manual dispatch is kept enabled while the remediation path is being proven out.
  workflow_dispatch:

if: (github.repository_owner == 'rancher' || vars.ENABLE_AGENTIC_WORKFLOWS == 'true') && vars.DISABLE_AW_DEAD_CODE_DETECTOR != 'true'

permissions:
  contents: read
  issues: read
  pull-requests: read
safe-outputs:
  create-issue:
    title-prefix: "[dead-code] "
    labels: [bot/dead-code-detector, bot/skip-grooming]
    group: true
    max: 3
  create-pull-request:
    draft: true
    title-prefix: "[dead-code] "
    labels: [bot/dead-code-detector, "QA/None"]
    # Mirrors the create-issue budget above. Section 1 of the prompt states the
    # rule this number enforces; keep the two in step.
    max: 3
    if-no-changes: ignore
    protected-files:
      policy: request_review
      # The detector maintains its own lessons file. Everything else under
      # .github/ stays protected — in particular it must never touch
      # .github/workflows/.
      exclude:
        - .github/agents/lessons/
  # Section 1 refutes a wrong issue and section 6 corrects an incomplete one by
  # commenting on it rather than filing a corrected duplicate, which needs this
  # output to be declared.
  add-comment:
    target: "*"
    max: 3
tools:
  github:
    min-integrity: none
# Remediation runs `yarn lint` and `yarn test:ci` before opening a pull request,
# so the budget has to cover a dependency install plus a full unit test run.
timeout-minutes: 45
strict: true

# Replaces the default checkout-only setup. Without a matching Node version and
# installed dependencies the gates in section 1 cannot run at all.
steps:
  - name: Checkout repository
    uses: actions/checkout@v6.0.2
    with:
      persist-credentials: false
  - name: Setup Node
    uses: actions/setup-node@v6.4.0
    with:
      node-version-file: '.nvmrc'
  - name: Install dependencies
    run: yarn install --frozen-lockfile --ignore-engines
---

# Dead Code Detection

Remove dead code from the codebase, and report what cannot yet be removed.

Filing an issue is the fallback, not the goal. A run that deletes one verified-dead cluster is worth more than a run that describes three.

## Task

Each run does one of these, in this order of preference:

1. **Remediate**: Take an open `bot/dead-code-detector` issue, re-verify it from scratch, delete the code, and open a pull request that closes the issue
2. **Refute**: If re-verification shows the issue is wrong, comment on it with the disproof instead of opening a pull request
3. **Detect**: Only when no open issue is actionable, look for new dead code and file an issue for it

Every path starts by reading `.github/agents/lessons/dead-code.md`, and ends by recording in it anything that misled the run.

**A run must never end silently.** If none of the three paths produced anything — the pull request budget was full and nothing was refutable, or detection found nothing new — call the `noop` tool and say in one sentence why. Ending with no output at all is indistinguishable from a crash, and the workflow files a failure issue for it. Being blocked is a legitimate result; not saying so is not.

## Context

- **Repository**: ${{ github.repository }}
- **Commit ID**: ${{ github.event.head_commit.id }}
- **Triggered by**: @${{ github.actor }}

## Analysis Workflow

### 0. Load the Lessons File

**Do this first, before anything else.** Read `.github/agents/lessons/dead-code.md`. If it does not exist, note that and continue.

It holds two things, and both bind this run:

- **The unknown-usage register** — exported code with no in-repo consumer that no one has been able to rule on. Anything already listed there has been dealt with: do not file it, do not remove it, do not re-report it, do not raise its confidence because you found the same emptiness again. Check every candidate against this register before doing anything with it
- **The lessons** — rules written because following this prompt alone still produced a wrong answer. Each one applies to this run with the same force as the checks in section 4

Then collect any **pending entries**: comments on open `bot/dead-code-detector` pull requests containing the marker `<!-- dead-code-detector:pending-lesson -->`. Those are entries an earlier run could not commit because a pull request was already open. Apply their rules to this run, and if this run opens a pull request, write them into the file alongside anything new you learn.

### 1. Remediation — Fix an Already-Reported Cluster

This is the primary path. Only fall through to the detection path in sections 2-6 if this section produces nothing.

**First, check the pull request budget:**

At most **three** pull requests labelled `bot/dead-code-detector` may be open at a time, the same ceiling the detection path has for issues. List open pull requests carrying that label before doing anything else, with the label listing rather than a search:

```bash
gh pr list --label bot/dead-code-detector --state open --json number,title,files
```

**Do not use the pull request or issue search tools for this.** GitHub's search API is capped at 30 requests an hour for this token and is routinely exhausted by other workflows before this one starts; the label listing above is a REST call under a far higher limit. A `403 API rate limit` from a search tool means you used the wrong tool, not that the run is blocked — switch to the CLI and continue.

The budget counts pull requests **open**, not pull requests opened by this run: two already open leaves room for one more, not for three.

- **The budget is full** — do not open another, and do not remove any code this run. A queue of unreviewed deletion pull requests is exactly the backlog this workflow was changed to stop producing. Spend the run on refutation instead (below), and if you learn something worth recording, follow the carry-over rule in section 7
- **There is room** — proceed, and carry the number of free slots through the rest of the run

**Select a candidate:**

1. List open issues labelled `bot/dead-code-detector` with `gh issue list --label bot/dead-code-detector --state open --json number,title,body`. **An empty result from the `list_issues` MCP tool is not an empty backlog.** Issues are tagged private-scoped and this agent holds no secrecy clearance, so that tool filters every one of them out and returns `[]` with no error. The CLI is not filtered. If a listing comes back empty, re-run it through the CLI before concluding there is nothing to work on
2. Discard any whose body or comments contain the marker `<!-- dead-code-detector:refuted -->` — a previous run already disproved it
3. Discard any already covered by an open pull request. **Checking for a `Closes`/`Fixes` link is not enough** — a pull request that names no issue still covers one. List the changed files of every open `bot/dead-code-detector` pull request with `gh pr diff <n> --name-only`, and discard any issue whose files overlap that set at all. A partial overlap counts: two pull requests deleting some of the same files will conflict on merge
4. Discard anything already on the unknown-usage register, and anything whose candidates are exported. Those are register rows, not removals — see "Published package surface" in section 4. If an open issue proposes removing an exported symbol, refute it and register the symbol instead
5. Discard the duplicates. A cluster is routinely filed several times over, in different words. Pick the **oldest** issue describing a cluster, and keep the numbers of its restatements — the removal resolves them all and the pull request has to close them all
6. From what remains, order by stated confidence and then by blast radius, and take as many as the budget allows. A three-file leaf cluster is a better candidate than an eighteen-file grab bag
7. Check the ones you took against each other. Two issues whose file sets overlap are one cluster, not two — merge them into a single removal that closes both, and pull the next candidate up to fill the slot

**Re-verify from scratch:**

The issue's own evidence does not count. A "Result: no matches" proves nothing on its own — the search that produced it may have matched nothing because it was malformed, and the lessons file records the forms that fail this way. Re-run every applicable check in section 4 against the code as it exists now, including the control search. Code may also have gained a consumer since the issue was filed.

**Then, for each candidate, take exactly one of these two actions:**

Work through the candidates one at a time and finish each before starting the next — re-verify, remove, gate, open the pull request, then move on. A run that half-removes several clusters delivers nothing. If the timeout is approaching, stop after the last completed pull request rather than leaving one unfinished.

- **Confirmed dead** — remove it:
  1. Delete the files and exports, and everything the transitive closure adds
  2. Remove what the deletion orphans: stylesheet rules, assets, barrel-file re-exports, i18n keys, and any now-empty directory
  3. Run `yarn lint` and `yarn test:ci`. If either fails, fix the fallout or abandon the removal — never open a pull request with a failing gate. **A gate that could not run has not passed.** If either command errors on a missing dependency, a runtime version, or anything other than your change, that is a failed gate: open no pull request, and say in the run summary exactly which command failed and what it printed. Do not reason about what the gate would have reported — the whole point of running it is that your reasoning is what is being checked
  4. Open a pull request using the template below. The body ends with `Closes #N` for the issue you selected, followed by one `Closes #M` line for **every** duplicate issue the same removal resolves — the ones you set aside at step 4 of selection. An unlinked pull request drains nothing from the backlog, which is the problem this path exists to solve
- **False positive, or no longer accurate** — do not open a pull request. Comment on the issue with:
  1. The marker `<!-- dead-code-detector:refuted -->` on its own line, so later runs skip it
  2. The exact command that found the live reference, and its output
  3. A one-line statement of what the original analysis missed

Refuting a bad issue is a successful run. It is worth more than a speculative removal, and it stops the same wrong finding being re-examined every night.

### 2. Changed Files Analysis

Identify and analyze modified files first:
- Determine files changed in the recent commits using `git log` and `git diff`
- Focus on source code files (`.ts`, `.js`, `.vue`) under `shell/` and `pkg/`
- **Exclude test files** from analysis (files matching patterns: `*_test.*`, `*.test.*`, `*.spec.*`, `test_*.*`, or located in directories named `test`, `tests`, `__tests__`, or `spec`)
- **Exclude generated files** and build artifacts
- **Exclude workflow files** from analysis (files under `.github/workflows/*`)
- Use code exploration tools to understand file structure
- Read modified file contents to examine changes

### 3. Dead Code Detection

Apply the following strategies to find dead code. For each candidate, you MUST verify it is genuinely unreferenced before reporting it — a single missed reference makes the finding a false positive.

**Unused exports**:
- Search for `export` declarations (functions, constants, classes, types) that are never imported anywhere else
- Use `grep`/`rg` to cross-reference each export against imports across the whole repository
- Account for re-exports (`export ... from`), barrel files (`index.ts`), and aliased imports

**Orphaned Vue components**:
- Components in `shell/components/`, `shell/pages/`, or `pkg/**/` that are never referenced in any template, route definition, or dynamic import
- Check both PascalCase (`<MyComponent>`) and kebab-case (`<my-component>`) usage in templates
- Account for components resolved dynamically (e.g. via `resolveComponent`, `defineAsyncComponent`, string-keyed lookups, or the Rancher model/registry mechanisms) — see the dynamic resolution checks in section 4

**Unreferenced utility functions**:
- Functions in `shell/utils/` (and equivalent util directories) with no callers anywhere in the codebase

**Test-only code**:
- Modules and exports whose only importers are their own tests. Run the reference check excluding `__tests__/`, `*.test.*` and `*.spec.*`, then confirm the remaining hits are zero
- Report the implementation and its test together as one removal. The test is not evidence the code is used — it is part of the same dead cluster

**Dead routes**:
- Route definitions pointing to page components that no longer exist

**Unused i18n keys**:
- Keys in locale files (e.g. `shell/assets/translations/en-us.yaml`) that are never referenced in templates or JS/TS via `t('...')`, `i18n-t`, `v-t`, or similar
- Be conservative: keys may be constructed dynamically (string concatenation, interpolation). Only report keys with a static, obviously-unused prefix path

### 4. Candidate Verification

Every candidate must pass all of the checks below before it can be reported. Each check exists because skipping it has already produced a wrong, overstated or incomplete finding.

#### Search command hygiene

A malformed search produces no output, and no output reads exactly like proof of deadness.

**Prove the command works before trusting a negative.** Run it once against a symbol known to be live. If the control search also returns nothing, the command is broken rather than the codebase. Never report a finding whose only evidence is an empty result from an untested command.

The specific search idioms that have produced false findings here — and what to use instead — are recorded in the lessons file. Read them before composing a search, not after.

#### Search breadth

A missed reference is a false positive, so cast the net wider than the source extensions:

- Search `.vue`, `.ts`, `.js`, `.json`, `.scss`, `.md` and `.yaml`
- Search the whole repository, not only `shell/` and `pkg/`. `cypress/`, `storybook/`, `docusaurus/` and `creators/` all reference code under `shell/`
- Search for the import path as well as the symbol name. `graph/Circle` finds `import GraphCircle from '@shell/components/graph/Circle'` — a search for `Circle` alone buries it in noise, and a search for `Circle.vue` misses it entirely because the extension is usually omitted
- Search for the local alias too: a component is frequently imported under a name that differs from its filename

#### Name collisions are not references

A match on a candidate's name is not automatically a usage:

- A CSS class, or an unrelated identifier that merely contains the name as a substring, is not a reference. Read every match before counting it as a consumer
- The reverse case matters too: a stylesheet rule left behind for a component you are removing is itself dead code. List it in the removal steps instead of letting it scare you off the finding

#### Dynamic resolution

Static search cannot see any of the following. Check each one explicitly, and state in the issue that you did:

- **`require.context` auto-registration.** Run `grep -rn "require.context" shell pkg --include=*.js --include=*.ts` and check whether the candidate's directory is covered by one of the resulting globs. Always re-run the grep; never work from a remembered list of globs. A directory registered this way has no imports by design, and its members are invoked by string name instead — so ruling one out means searching for the quoted name across config directories and across git history, not searching for imports. The lessons file records which globs exist and how to search the directories they cover
- **Convention directories resolved from a Kubernetes resource type at runtime**: `shell/models/`, `shell/detail/`, `shell/edit/`, `shell/list/`, `shell/chart/`, `shell/cloud-credential/`, `shell/machine-config/`, `shell/promptRemove/`, `shell/dialog/`, and the `pkg/*/` equivalents. A file named after a resource type (e.g. `provisioning.cattle.io.cluster.vue`) is loaded by name, so no import statement will ever exist. Never report a file in these directories as an orphaned file
- **`defineAsyncComponent`, `resolveComponent`, `<component :is="...">` with a computed name, and template-literal import paths**

#### Entry points are never dead

A module whose job is to expose an API has no in-repo importers by design. That is what it is for, not evidence against it. Never report:

- `shell/apis/**` — the composition-API surface for UI extensions. `shell/apis/index.ts` opens with "Main export for APIs" and exists precisely so that out-of-tree extensions can import from `@shell/apis`
- Anything reachable as a package entry: `main`, `types` or `exports` in a `package.json`, and the `entry` lists in build or tooling config
- `shell/initialize/entry.js`, `shell/config/router/routes.js`, store/plugin/directive registration files, and the `pkg/*/index.ts` extension entry points

#### Published package surface

`shell/package.json` publishes `@rancher/shell` with `"files": ["**/*"]`. Every file under `shell/` ships to npm and can be imported by an out-of-tree UI extension as `@shell/...`. A repository-wide search cannot prove those consumers do not exist.

**Never recommend removing anything that is exported.** If a symbol is `export`ed, or a component lives in a file that ships in the published package, its consumers are not knowable from this repository and "no importers here" is not evidence of deadness. This is a hard rule, not a confidence adjustment: no amount of searching promotes an unprovable negative into a removal.

- Do not write "not part of any public extension API" about a file under `shell/`
- Do not file an exported symbol as a removal candidate. Record it in the unknown-usage register instead (below), which is where findings of this shape accumulate until someone with knowledge of the extension ecosystem can rule on them
- What may still be reported for removal: code that is not exported at all — module-private functions and constants, and files whose only export is consumed nowhere in the repository *and* which do not ship in the published package (anything outside `shell/`, such as `cypress/`, `storybook/`, `docusaurus/` and `creators/`)

#### Transitive closure

Dead code arrives in chains, and reporting only the leaves understates the cluster:

1. Read the imports of each confirmed-dead file
2. For every in-repo module it imports, re-run the reference check while treating the already-confirmed-dead files as if they had been deleted
3. Anything whose only remaining consumers are dead is dead too — add it to the cluster, then repeat until the set stops growing
4. Work upwards as well: if a candidate's only importer is itself unreferenced, that importer belongs in the same cluster

**A consumer only exonerates a file if the consumer is itself reachable.** Finding one importer and stopping there is the most common way this check fails. Before concluding "X is still used by Y", run the reference check on Y, and keep walking up until you reach something reachable or the chain ends. The chain crosses directory boundaries, so the cluster can be larger than the directory it started in.

#### Age evidence

Cheap to gather, and the strongest available signal that code was abandoned rather than added recently and not yet wired up:

- `git log -1 --format="%ad %h %s" --date=short -- <file>` for the last change to each file
- `git log --oneline -S "<symbol>" -- .` to find the commit where the last usage disappeared

Include both in the issue. A component whose last consumer was deleted years ago is a far safer removal than one added last month, and the dates let a reviewer judge that without repeating the work.

How the code came to be unreferenced sets the confidence level, and the shapes it takes are described under "Provenance and confidence" in `.github/agents/lessons/dead-code.md`. Establish which one applies before assigning a confidence to a candidate.

#### Check claims, do not infer them

Every statement in the issue must be something determined, not something that seemed likely:

- Before saying a directory becomes empty, `ls` it and list the files that remain along with who uses them
- Before quoting a line count, run `wc -l`
- Never write a conditional instruction ("check whether X, and if so do Y") into the removal steps. Resolve it — that check *is* the analysis being asked for
- Anything genuinely undeterminable belongs in the issue as an explicit open question, not as an assumption

### 5. Dead Code Evaluation

Assess findings to distinguish true dead code from intentional or dynamically-referenced code:

**Dead Code Types**:
- **Unused Exports**: Exported symbols with zero importers
- **Orphaned Files**: Whole files/components no longer referenced anywhere
- **Unreachable Code**: Code paths that can never execute
- **Dead Routes**: Route entries whose targets are gone
- **Unused i18n Keys**: Translation keys with no consumers

**Assessment Criteria**:
- **Confidence**: How certain you are the code is truly unreferenced (only report high-confidence findings). The provenance shape sets the ceiling, and the three shapes and their bands are defined under "Provenance and confidence" in the lessons file — establish which one applies rather than picking a number that matches how the finding feels
  - **Low (<70%)**: unclear provenance, recent changes, or a dynamic resolution pattern that could not be ruled out — DO NOT report these
  - Any open question about whether the code is *meant* to have no in-repo consumers caps the rating at Low. Confidence describes what you established, not how plausible the finding feels
- **Severity**: Amount of dead code (lines, number of symbols/files)
- **Impact**: Maintenance burden and codebase bloat removed by deletion
- **Safety**: Whether removal is safe — dynamic resolution ruled out, transitive closure complete, and the published `@shell/*` surface accounted for

### 6. Issue Reporting

Create separate issues for each distinct category or cluster of dead code found (maximum 3 per run). Each issue should be focused enough to enable a clean removal PR.

#### Check what has already been reported

**Do this before creating anything.** This workflow runs daily against a codebase that changes slowly, so on any given run most of what you find has already been filed — and an issue nobody has acted on yet is still open, still accurate, and still waiting.

Use the GitHub tools to list open issues labelled `bot/dead-code-detector`, and read their titles and bodies. Then, for each cluster you were about to report:

- **Already covered** — do not file it again. Partial overlap counts: if an open issue lists three of your four files, that is the same cluster, not a new one
- **Covered but wrong or incomplete** — do not file a corrected duplicate. Add a comment to the existing issue with the correction. If the existing issue is wrong rather than merely incomplete, refute it as described in section 1, marker included
- **Genuinely new** — file it, and name in the body which existing issues you checked against

#### Register, do not report, anything exported

A candidate that is exported does not become an issue. It becomes a row in the unknown-usage register in `.github/agents/lessons/dead-code.md`, for the reason given under "Published package surface" in section 4: its consumers live outside this repository and no search here can rule them out.

For each such candidate, produce the row: the date, the symbol or file, what it is exported as (`@shell/...` where it applies), the in-repo consumer count you measured, today's date as the last re-check, and a one-line note on what you searched.

Then place it:

- **The run is opening a pull request** — write the rows into the register in that pull request, and re-check the rows already there while you are in the file. An entry that has since gained an in-repo consumer is resolved: say which consumer, and take it off the list
- **The run is opening no pull request** — put the rows verbatim in the run summary, under a heading that says they are pending registration. They are picked up by the next run that opens one

Never delete a register row because it has been there a long time. It leaves when the question is answered, not when it gets old.

#### Cluster boundaries

Apply a fixed rule so the boundary does not drift between runs:

- A cluster is **one directory, plus whatever its members transitively drag in**. Two sibling component directories are two clusters; loose files directly under a shared parent are a third
- Never file one issue spanning several unrelated directories merely because everything in it is an unreferenced component. That is a report, not a cluster, and it cannot become a clean PR
- Do not split a single directory across multiple issues either
- Derive every count and total from the list you are about to publish, counted rather than estimated

**When to Create Issues**:
- Only create issues if significant dead code is found (threshold: >10 lines of dead code OR 3+ unused symbols/files in a related cluster)
- **Create one issue per distinct dead-code cluster** — do NOT bundle unrelated findings in a single issue
- Limit to the top 3 most significant clusters if more are found
- Use the `create_issue` tool from safe-outputs MCP **once for each cluster**
- If you cannot verify with high confidence that code is dead, do NOT report it

**Issue Contents for Each Cluster**:
- **Executive Summary**: Brief description of this specific dead-code cluster
- **Dead Code Details**: Specific files, symbols, and locations for this cluster only
- **Verification Evidence**: How you confirmed each item is unreferenced (search commands/results)
- **Impact Assessment**: Lines/files removed, maintainability improvement
- **Removal Recommendations**: Concrete, safe removal steps

### 7. Improving This Detector

Every run that gets surprised should leave the next run better equipped. When something misleads you, write it into `.github/agents/lessons/dead-code.md` — the lessons file this workflow keeps for itself.

**What qualifies as a lesson:**

- A dynamic resolution mechanism that this prompt does not list — a `require.context` glob, a registry, a naming convention, a build-time transform — which made live code look unreferenced
- A search idiom that returned a misleading result: a command that silently matched nothing, an import form the search missed, a name collision that hid the real attribution
- A repository convention that makes a file reachable without an import statement
- An open issue whose stated evidence did not reproduce, along with what the original analysis missed
- A removal that broke `yarn lint` or `yarn test:ci` in a way the reference check did not predict

**What does not qualify:**

- A restatement of a rule already in this prompt. An entry earns its place only if following this prompt as written would still have produced the wrong answer
- A one-off observation about a specific file with no general rule behind it
- Anything you did not actually run into on this run. Do not speculate about failure modes
- Anything that is not about identifying dead code. A problem with the workflow itself — a missing dependency, a wrong runtime version, a gate that will not start — is not a lesson. Report it in the run summary and move on

**Write the entry repository-agnostically.** Describe the pattern, not where it was filed — never name a repository or a fork, and do not cite issue numbers. The file travels with the workflow, so a number that resolves somewhere else is worse than no reference at all.

**Resembling an existing entry is not the same as being covered by it.** Before dismissing something as already recorded, read the entry you have in mind and check that its **Rule** would actually have caught this case. Two failures can share a symptom and still need different checks — if the existing rule would have let this one through, write a new entry and say in it how the two differ.

**How to record it:**

1. Append to the end of the `## Entries` section of `.github/agents/lessons/dead-code.md`, using the exact entry format that file specifies: a dated `###` heading, then **Trigger**, **Rule** and **Command**
2. The **Rule** must be an instruction for a future run, not a description of what happened
3. The **Command** must be one you actually ran, with its real output — including, where it makes the point, the broken form alongside the working form
4. Never edit or delete existing entries. The file only grows

**Where the entry ships**, given the pull request budget in section 1:

- **This run is opening one or more removal pull requests** — include the lessons change in the **first** one, and describe it in the Lessons section of its body. A lessons entry never gets a pull request of its own while a removal is available to carry it, and it must not be duplicated across several
- **This run is opening no pull request** (the budget was full, or the run refuted an issue instead) — do not spend a slot on the entry alone. Post it, verbatim and in the format above, as a comment on an open `bot/dead-code-detector` pull request, prefixed with the marker `<!-- dead-code-detector:pending-lesson -->` on its own line. Section 0 collects those markers, so the next run that opens a pull request writes them into the file. If no pull request is open at all, write the entry into the file and open the pull request for it

**Never modify anything under `.github/` other than `.github/agents/lessons/dead-code.md`.** That includes this workflow and its lock file. Proposals to change this prompt go in the lessons file, which is read at the start of every run and therefore takes effect immediately without a workflow edit.

## Detection Scope

### Report These Issues

- Module-private functions, constants, classes or types — declared without `export` — that nothing in their own file uses
- Vue components never referenced in templates, routes, or dynamic imports, and not shipped in the published package
- Utility functions with no callers, where the function is not exported
- Route definitions pointing to non-existent components
- Translation (i18n) keys never referenced
- Whole files that are no longer imported anywhere and do not ship in the published package

Anything **exported** that has no importers goes to the unknown-usage register instead of into a removal issue. See "Published package surface" in section 4.

### Skip These Patterns

- **Anything exported.** An `export` puts the symbol on a surface this repository cannot see the far side of. Never recommend its removal; register it instead
- Public/extension API surface intended for external consumption (e.g. exports re-exported from package entry points, plugin/extension APIs) — in this repository that means `shell/apis/**`, `pkg/*/index.ts`, and anything named as a `main`/`types`/`exports` target or a build-config entry
- Anything already described by an open `bot/dead-code-detector` issue
- Code referenced dynamically (string-keyed lookups, `resolveComponent`, `defineAsyncComponent`, model/registry auto-registration, dynamically-built i18n keys)
- Framework lifecycle hooks and conventionally-named files auto-loaded by the build (e.g. auto-registered store modules, config directories)
- **All test files** (files matching: `*_test.*`, `*.test.*`, `*.spec.*`, `test_*.*`, or in `test/`, `tests/`, `__tests__/`, `spec/` directories)
- **All workflow files** (files under `.github/workflows/*`)
- Generated code or vendored dependencies (e.g. `node_modules/`)
- Type declarations required for compilation even if not directly imported

### Analysis Depth

- **Primary Focus**: Files changed in recent commits (excluding test and workflow files)
- **Secondary Analysis**: Cross-reference candidates against the entire repository to confirm they are unreferenced
- **Cross-Reference**: Check barrel files, re-exports, and dynamic resolution before concluding code is dead
- **Closure**: Follow the imports of confirmed-dead files to find the rest of the cluster, rather than reporting only the leaves
- **Historical Context**: Use `git log` to establish whether the code was recently added (possibly not yet wired up) or genuinely abandoned, and include the dates as evidence

## Issue Template

For each distinct dead-code cluster found, create a separate issue using this structure:

````markdown
# 🧹 Dead Code Detected: [Cluster Name]

*Analysis of commit ${{ github.event.head_commit.id }}*

*Left as an issue rather than a pull request because: [confidence below the removal threshold / cluster too large to remove safely in one run / lint or test gate could not be run]. A later run will pick this up from section 1.*

## Summary

[Brief overview of this specific dead-code cluster]

## Dead Code Details

### [Category]: [Description]
- **Confidence**: High
- **Severity**: High/Medium/Low
- **Items**: [Number of symbols/files]
- **Locations**:
  - `path/to/file1.ext` (lines X-Y) — [symbol/component name]
  - `path/to/file2.ext` — [orphaned file]

## Verification Evidence

- Searched for references with: `[command used]`
- Result: [no importers / no template references / etc.]
- Control search: [the same command run against a symbol known to be live, proving it returns hits when hits exist]
- Import forms covered: [`@shell/...` alias, `./` and `../` relative, `~/` — all checked]
- Existing issues checked: [numbers of the open `bot/dead-code-detector` issues compared against, and why this cluster is not among them]
- Dynamic resolution ruled out: [`require.context` globs checked, convention directories checked, async/`:is` lookups checked — and why none apply]
- Transitive closure: [files added by following the imports of the confirmed-dead files, or "none — all candidates are leaves"]
- Last changed: [date + commit, per file]
- Last usage removed in: [commit that deleted the final consumer, or "not identifiable"]
- Files remaining in the affected directories: [names + who uses them, or "none"]

## Historical Context

[Which provenance shape this is, per the lessons file, and the git commands and output that establish it. State the shape, do not restate the rubric.]

## Impact Analysis

- **Maintainability**: [How removal reduces maintenance burden]
- **Code Bloat**: [Lines/files removed, from `wc -l`]
- **Safety**: [Why removal is safe — dynamic resolution ruled out, closure complete. For files under `shell/`, note that they are part of the published `@rancher/shell` package and that out-of-tree extension consumers cannot be ruled out by search]

## Removal Recommendations

1. **[Recommendation 1]**
   - Remove: `path/to/file.ext`
   - Also update: [barrel files / re-exports that reference it]
   - Estimated effort: [complexity]

2. **[Recommendation 2]**
   [... additional recommendations ...]

## Implementation Checklist

- [ ] Re-verify each item is still unreferenced
- [ ] Remove dead code and any now-empty files
- [ ] Remove orphaned styles and assets left behind by the removed code
- [ ] Update barrel files / re-exports
- [ ] Add a release note if any removed file was under `shell/` (published `@rancher/shell` surface)
- [ ] Run lint and unit tests (`yarn lint`, `yarn test:ci`)
- [ ] Verify no functionality broken

## Analysis Metadata

- **Analyzed Files**: [count]
- **Detection Method**: Cross-reference of exports/components/keys against the repository
- **Commit**: ${{ github.event.head_commit.id }}
- **Analysis Date**: [timestamp]
````

## Pull Request Template

For a removal produced by section 1, use this structure. The evidence is not optional — a reviewer must be able to reach the same conclusion without repeating the search.

````markdown
# 🧹 Remove dead code: [Cluster Name]

Removes the [cluster] reported in #N, after re-verifying every item against the current code.

## What was removed

| File | Lines | Why it is dead |
| --- | --- | --- |
| `path/to/file.ext` | NN | [no importers / only consumer was also dead / replaced by X in commit abc123] |

Total: [N files, N lines, from `wc -l`]

## Re-verification

The evidence in #N was not reused. Every check below was re-run against the code as of this branch.

- Reference search: `[exact command]` → [result]
- Control search: `[same command against a symbol known to be live]` → [hit count, proving the command works]
- Import forms covered: `@shell/...`, `./`, `../`, `~/` — all checked
- Dynamic resolution ruled out: [`require.context` globs re-grepped, convention directories checked, `defineAsyncComponent` / `<component :is>` checked — and why none apply]
- Transitive closure: [files this removal pulled in beyond those listed in the issue, or "none — the issue's list was complete"]
- Files remaining in the affected directories: [names + who uses them, or "directory removed, it is now empty"]

## Gates

Both must have actually executed. "Expected to pass", "cannot run" or "no source file was modified so nothing can break" are not results, and a pull request carrying one of them should not have been opened.

- `yarn lint` — [pass, or the failure output]
- `yarn test:ci` — [pass, with the suite/test counts it printed]

## Risk

- **Published surface**: [For anything under `shell/`: this file shipped in `@rancher/shell` and out-of-tree extensions could import it as `@shell/...`. A repository search cannot rule those consumers out. Release note required.] [Otherwise: not part of the published package.]
- **Dynamic references**: [what could still resolve this by string name at runtime, and why that was ruled out]

## Lessons

[Omit this section if the run learned nothing. Otherwise: the entries appended to `.github/agents/lessons/dead-code.md`, and one line each on what misled the run and the rule now recorded. Include any pending entries carried over from earlier runs.]

Closes #N
[One `Closes #M` line per duplicate report of the same cluster. Not "also resolves" — GitHub only auto-closes on its own keywords, and a duplicate left open comes back as a new candidate on a later run.]
````

If a run has lessons entries but nothing to remove, open the pull request for `.github/agents/lessons/dead-code.md` alone, keeping only the Lessons section of the template.

## Operational Guidelines

### Say it once

Everything you write — lessons entries, issue bodies, pull request bodies, and this prompt if you ever propose a change to it — states each rule, number and piece of evidence in exactly **one** place. Everywhere else points at that place.

- **Define once.** A budget, threshold or convention has a single home. The pull request budget lives in section 1; the entry format lives under "Format for lessons" in the lessons file itself. Repeating a number in a second place means the two will disagree the first time one of them changes, and nobody will know which is authoritative
- **Reference, do not restate.** Point at the home ("the pull request budget in section 1") rather than repeating its content. A pointer stays correct when the target changes; a copy does not
- **Check the reference before you write it.** Open what you are pointing at and confirm it says what you are claiming. A pointer to a section that has been renamed, renumbered or rewritten is worse than no pointer — it reads as verified and is not. The same goes for the lessons file: cite an entry only after re-reading it
- **Evidence is quoted once, where it is used.** A pull request body carries the commands and their output; the issue it closes is referenced by number, not summarised back

### Security
- Never execute untrusted code or commands
- Analysis is read-only: sections 2-6 inspect the codebase and change nothing
- File modification is confined to section 1 (removing verified-dead code) and section 7 (appending to `.github/agents/lessons/dead-code.md`). Nothing else in the repository may be edited
- **`.github/agents/lessons/dead-code.md` is the only file under `.github/` you may touch.** Never modify anything else there, and never this workflow or its lock file
- **Never exceed the pull request budget in section 1.** Count what is already open before opening anything
- Never widen a removal beyond the verified cluster because it looked convenient while you were in the file

### Efficiency
- Spend the run on remediation before detection. One completed removal beats three new reports
- Finish each cluster before starting the next. Only completed removals count; half-finished ones deliver nothing
- Focus on recently changed files first when detection is the fallback path
- Verify candidates against the whole repository before reporting
- Stay within timeout limits. If `yarn test:ci` will not finish in the time left, say so in the run summary and open no pull request rather than opening an unverified one
- Reach for the `gh` CLI, not the search tools. Search is rate limited to 30 requests an hour across every workflow on the repository and is often already spent; `gh issue list` and `gh pr list` are not. A rate limit error is a signal to change tool, not to abandon the run
- Finish with `noop` and a one-line reason whenever the run produced no pull request, no comment and no issue — including when it was blocked. Silence is reported as a failure

### Accuracy
- **False positives are worse than misses** — only report dead code you have verified is unreferenced with high confidence
- Run every check in section 4 before reporting; do not substitute plausibility for verification
- Account for dynamic references, re-exports, barrel files, and the published `@rancher/shell` surface
- Consider Vue and Rancher-specific idioms (model/registry auto-registration, `require.context`, resource-type-derived file resolution)
- Provide the exact search evidence that proves each item is dead
- An understated cluster is also a defect: report the full transitive closure, not just the files that first caught your attention
- A duplicate of an already-open issue is also a defect: check the open `bot/dead-code-detector` issues before filing
- Treat an empty search result as suspicious until the command has been shown to work on a live symbol. Most false findings here trace back to a command that searched nothing
- Prefer saying "could not determine" over asserting something convenient

### Issue Creation
- Only reachable when section 1 produced nothing. If an open issue was remediated or refuted, that was the run
- Create **one issue per distinct dead-code cluster** — do NOT bundle unrelated findings in a single issue
- Limit to the top 3 most significant clusters if more are found
- Only create issues if significant, high-confidence dead code is found
- Include sufficient detail for coding agents to understand and act on findings
- Provide concrete file paths, line numbers, and verification evidence
- Use descriptive titles that clearly identify the specific cluster (e.g., "Dead Code: Unused Exports in Formatter Utils")

### Pull Request Creation
- Open a pull request only for a cluster you re-verified on this run and whose lint and test gates passed
- One cluster per pull request. Never combine two unrelated clusters into one, and never split one cluster across two — each pull request has to be independently reviewable and independently revertable. A lessons entry from section 7 rides along in the first pull request the run opens rather than taking a slot of its own
- No two pull requests from a run may touch the same file. If two clusters overlap they were one cluster; merge them and close both issues from the one pull request
- Every pull request body carries the re-verification evidence, not a summary of it. A reviewer must be able to reproduce the conclusion from the commands quoted
- End the body with a `Closes #N` line for the issue selected and one more for every duplicate the removal resolves. Only GitHub's own closing keywords auto-close; prose like "also resolves #A" leaves the issue open and it returns as a candidate on a later run
- If the removal turns out larger or riskier than the issue described, open no pull request. Comment on the issue with what the closure actually contains and let a human scope it

**Objective**: Reduce the codebase and the backlog together. A run succeeds when it deletes verified-dead code, disproves a wrong report, or records a lesson that stops the next run repeating a mistake — not when it produces the most output.
