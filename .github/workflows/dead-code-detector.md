---
name: Dead Code Detector
description: Identifies dead and unused code across the codebase and suggests safe removal opportunities
on:
  schedule: daily

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
  # Section 4 corrects an existing issue by commenting on it rather than filing
  # a corrected duplicate, which needs this output to be declared.
  add-comment:
    target: "*"
    max: 3
tools:
  github:
    min-integrity: none
timeout-minutes: 15
strict: true
---

# Dead Code Detection

Analyze the codebase to identify dead and unused code. Report significant findings that can be safely removed to reduce maintenance burden and codebase size.

## Task

Detect and report dead code by:

1. **Loading the Lessons**: Read `.github/agents/lessons/dead-code.md` before anything else
2. **Analyzing Recent Commits**: Review changes in the latest commits to focus the analysis
3. **Detecting Dead Code**: Identify unused exports, unreferenced components, orphaned files, dead routes, and unused i18n keys
4. **Verifying Candidates**: Rule out dynamic resolution, follow the dead-code chain to its full extent, and check every claim before making it
5. **Reporting Findings**: Check what is already open, then create a detailed issue for anything genuinely new (threshold below)

## Context

- **Repository**: ${{ github.repository }}
- **Commit ID**: ${{ github.event.head_commit.id }}
- **Triggered by**: @${{ github.actor }}

## Analysis Workflow

### 0. Load the Lessons File

**Do this first, before anything else.** Read `.github/agents/lessons/dead-code.md`. If it does not exist, note that and continue.

It holds two things, and both bind this run:

- **The unknown-usage register** — exported code with no in-repo consumer that no one has been able to rule on. Anything already listed there has been dealt with: do not file it, do not re-report it, do not raise its confidence because you found the same emptiness again. Check every candidate against this register before doing anything with it
- **The lessons** — rules written because following this prompt alone still produced a wrong answer. Each one applies to this run with the same force as the checks in section 3

### 1. Changed Files Analysis

Identify and analyze modified files first:
- Determine files changed in the recent commits using `git log` and `git diff`
- Focus on source code files (`.ts`, `.js`, `.vue`) under `shell/` and `pkg/`
- **Exclude test files** from analysis (files matching patterns: `*_test.*`, `*.test.*`, `*.spec.*`, `test_*.*`, or located in directories named `test`, `tests`, `__tests__`, or `spec`)
- **Exclude generated files** and build artifacts
- **Exclude workflow files** from analysis (files under `.github/workflows/*`)
- Use code exploration tools to understand file structure
- Read modified file contents to examine changes

### 2. Dead Code Detection

Apply the following strategies to find dead code. For each candidate, you MUST verify it is genuinely unreferenced before reporting it — a single missed reference makes the finding a false positive.

**Unused exports**:
- Search for `export` declarations (functions, constants, classes, types) that are never imported anywhere else
- Use `grep`/`rg` to cross-reference each export against imports across the whole repository
- Account for re-exports (`export ... from`), barrel files (`index.ts`), and aliased imports

**Orphaned Vue components**:
- Components in `shell/components/`, `shell/pages/`, or `pkg/**/` that are never referenced in any template, route definition, or dynamic import
- Check both PascalCase (`<MyComponent>`) and kebab-case (`<my-component>`) usage in templates
- Account for components resolved dynamically (e.g. via `resolveComponent`, `defineAsyncComponent`, string-keyed lookups, or the Rancher model/registry mechanisms) — see the dynamic resolution checks in section 3

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

### 3. Candidate Verification

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

### 4. Dead Code Evaluation

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

### 5. Issue Reporting

Create separate issues for each distinct category or cluster of dead code found (maximum 3 per run). Each issue should be focused enough to enable a clean removal PR.

#### Check what has already been reported

**Do this before creating anything.** This workflow runs daily against a codebase that changes slowly, so on any given run most of what you find has already been filed — and an issue nobody has acted on yet is still open, still accurate, and still waiting.

Use the GitHub tools to list open issues labelled `bot/dead-code-detector`, and read their titles and bodies. Then, for each cluster you were about to report:

- **Already covered** — do not file it again. Partial overlap counts: if an open issue lists three of your four files, that is the same cluster, not a new one
- **Covered but wrong or incomplete** — do not file a corrected duplicate. Add a comment to the existing issue with the correction
- **Genuinely new** — file it, and name in the body which existing issues you checked against

#### Register, do not report, anything exported

A candidate that is exported does not become an issue. It becomes a row in the unknown-usage register in `.github/agents/lessons/dead-code.md`, for the reason given under "Published package surface" in section 3: its consumers live outside this repository and no search here can rule them out.

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

## Detection Scope

### Report These Issues

- Module-private functions, constants, classes or types — declared without `export` — that nothing in their own file uses
- Vue components never referenced in templates, routes, or dynamic imports, and not shipped in the published package
- Utility functions with no callers, where the function is not exported
- Route definitions pointing to non-existent components
- Translation (i18n) keys never referenced
- Whole files that are no longer imported anywhere and do not ship in the published package

Anything **exported** that has no importers goes to the unknown-usage register instead of into a removal issue. See "Published package surface" in section 3.

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

**Assignee**: @copilot

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

## Operational Guidelines

### Security
- Never execute untrusted code or commands
- Only use read-only analysis tools
- Do not modify files during analysis

### Efficiency
- Focus on recently changed files first
- Verify candidates against the whole repository before reporting
- Stay within timeout limits (balance thoroughness with execution time)

### Accuracy
- **False positives are worse than misses** — only report dead code you have verified is unreferenced with high confidence
- Run every check in section 3 before reporting; do not substitute plausibility for verification
- Account for dynamic references, re-exports, barrel files, and the published `@rancher/shell` surface
- Consider Vue and Rancher-specific idioms (model/registry auto-registration, `require.context`, resource-type-derived file resolution)
- Provide the exact search evidence that proves each item is dead
- An understated cluster is also a defect: report the full transitive closure, not just the files that first caught your attention
- A duplicate of an already-open issue is also a defect: check the open `bot/dead-code-detector` issues before filing
- Treat an empty search result as suspicious until the command has been shown to work on a live symbol. Most false findings here trace back to a command that searched nothing
- Prefer saying "could not determine" over asserting something convenient

### Issue Creation
- Create **one issue per distinct dead-code cluster** — do NOT bundle unrelated findings in a single issue
- Limit to the top 3 most significant clusters if more are found
- Only create issues if significant, high-confidence dead code is found
- Include sufficient detail for coding agents to understand and act on findings
- Provide concrete file paths, line numbers, and verification evidence
- Assign issue to @copilot for automated remediation
- Use descriptive titles that clearly identify the specific cluster (e.g., "Dead Code: Unused Exports in Formatter Utils")

**Objective**: Improve code quality by identifying and reporting genuinely dead code that can be safely removed. Prioritize high-confidence, actionable findings over exhaustive coverage.
