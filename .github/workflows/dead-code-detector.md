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
    expires: 2d
    title-prefix: "[dead-code] "
    labels: [bot/dead-code-detector, bot/skip-grooming]
    group: true
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

1. **Analyzing Recent Commits**: Review changes in the latest commits to focus the analysis
2. **Detecting Dead Code**: Identify unused exports, unreferenced components, orphaned files, dead routes, and unused i18n keys
3. **Verifying Candidates**: Rule out dynamic resolution, follow the dead-code chain to its full extent, and check every claim before making it
4. **Reporting Findings**: Check what is already open, then create a detailed issue for anything genuinely new (threshold below)

## Context

- **Repository**: ${{ github.repository }}
- **Commit ID**: ${{ github.event.head_commit.id }}
- **Triggered by**: @${{ github.actor }}

## Analysis Workflow

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
- Modules and exports whose only importers are their own tests. Static tools that treat a test file as a legitimate importer will never surface these, so they have to be looked for deliberately: run the reference check excluding `__tests__/`, `*.test.*` and `*.spec.*`, then confirm the remaining hits are zero
- Report the implementation and its test together as one removal. The test is not evidence the code is used — it is part of the same dead cluster
- Verified examples of this shape: `ALL_STATE_COLORS`, `toBgColor` and `getHighestAlertColor` in `shell/utils/style.ts`, and `shell/utils/poller-sequential.js`

**Dead routes**:
- Route definitions pointing to page components that no longer exist

**Unused i18n keys**:
- Keys in locale files (e.g. `shell/assets/translations/en-us.yaml`) that are never referenced in templates or JS/TS via `t('...')`, `i18n-t`, `v-t`, or similar
- Be conservative: keys may be constructed dynamically (string concatenation, interpolation). Only report keys with a static, obviously-unused prefix path

### 3. Candidate Verification

Every candidate must pass all of the checks below before it can be reported. Each check exists because skipping it has already produced a wrong, overstated or incomplete finding.

#### Search command hygiene

A malformed search produces no output, and no output reads exactly like proof of deadness. Each mistake below has already produced an entirely false issue:

- **Never use brace expansion in `--include`.** `grep --include="*.{ts,js,vue}"` matches **zero files** — `--include` takes a single glob and does not expand braces, so the command exits cleanly having searched nothing. Pass repeated flags instead: `--include="*.ts" --include="*.js" --include="*.vue"`, or use `rg`, which does not need them. Issues have been filed on evidence consisting entirely of empty output from this pattern
- **Prove the command works before trusting a negative.** Run it once against a symbol known to be live. If the control search also returns nothing, the command is broken rather than the codebase. Never report a finding whose only evidence is an empty result from an untested command
- **Search every import form, not just the `@shell` alias.** In-directory imports use `./name`, and `../` and `~/` forms also appear. A search for `utils/queue` misses `import Queue from './queue'` entirely — which is exactly how `shell/utils/queue.js` came to be reported as dead while `shell/utils/promise.js` was importing it
- **Attribute a symbol to its module before calling it unused.** The same exported name can be defined in more than one file: `sortableNumericSuffix` exists in both `shell/utils/string.js` and `shell/utils/sort.js`, and every consumer imports it from `sort`. A name-only search cannot separate the two. Read the module path in each importer's `from` clause. When a symbol looks unused, check whether a second definition elsewhere is absorbing all the traffic — that does make the duplicate dead, but for a different reason and with a different fix, and the issue must say which copy is which
- **Do not exclude the defining file by bare filename.** `grep -v "version.js"`, intended to drop a definition in `shell/utils/version.js`, also drops any other `version.js` that is a genuine consumer

#### Search breadth

A missed reference is a false positive, so cast the net wider than the source extensions:

- Search `.vue`, `.ts`, `.js`, `.json`, `.scss`, `.md` and `.yaml`
- Search the whole repository, not only `shell/` and `pkg/`. `cypress/`, `storybook/`, `docusaurus/` and `creators/` all reference code under `shell/`
- Search for the import path as well as the symbol name. `graph/Circle` finds `import GraphCircle from '@shell/components/graph/Circle'` — a search for `Circle` alone buries it in noise, and a search for `Circle.vue` misses it entirely because the extension is usually omitted
- Search for the local alias too: a component is frequently imported under a name that differs from its filename

#### Name collisions are not references

A match on a candidate's name is not automatically a usage:

- A CSS class (`.count-gauge`) or an unrelated identifier that merely contains the name (`totalCountGaugeInput`) does not reference `CountGauge.vue`. Read every match before counting it as a consumer
- The reverse case matters too: a stylesheet rule left behind for a component you are removing is itself dead code. List it in the removal steps instead of letting it scare you off the finding

#### Dynamic resolution

Static search cannot see any of the following. Check each one explicitly, and state in the issue that you did:

- **`require.context` auto-registration.** Run `grep -rn "require.context" shell pkg --include=*.js --include=*.ts` and check whether the candidate's directory is covered by one of the resulting globs. Re-run the grep rather than trusting a remembered list — at time of writing it covers `shell/components/formatter/*.vue` (`shell/plugins/formatters.js`, `shell/plugins/global-formatters.js`) and `shell/config/product/*` (`shell/utils/dynamic-importer.js`)
  - **CRITICAL for formatters**: All Vue components in `shell/components/formatter/` matching `/[A-Z]\w+\.(vue)$/` are **automatically registered globally** by `require.context` in two places:
    1. `shell/plugins/formatters.js` — adds them to the `FORMATTERS` object cache used by `SortableTable`
    2. `shell/plugins/global-formatters.js` — registers them as global Vue components
  - This means formatters ARE available at runtime via string-based references (e.g., `formatter: 'ComponentName'` in table configs) even without explicit imports
  - To verify a formatter is unused, you must search for **string-based references**: `grep -r "'FormatterName'\|\"FormatterName\"" shell/config pkg` and check table header definitions in `shell/config/table-headers.js` and all `pkg/*/config/` directories
  - Also search the entire git history: `git log -p --all -S "FormatterName" -- "shell/config/" "pkg/"` to see if it was ever used and later replaced
  - Even if no current references exist, note in the issue that the component is part of the auto-registration system and could theoretically be referenced by external UI extensions via string name
- **Convention directories resolved from a Kubernetes resource type at runtime**: `shell/models/`, `shell/detail/`, `shell/edit/`, `shell/list/`, `shell/chart/`, `shell/cloud-credential/`, `shell/machine-config/`, `shell/promptRemove/`, `shell/dialog/`, and the `pkg/*/` equivalents. A file named after a resource type (e.g. `provisioning.cattle.io.cluster.vue`) is loaded by name, so no import statement will ever exist. Never report a file in these directories as an orphaned file
- **`defineAsyncComponent`, `resolveComponent`, `<component :is="...">` with a computed name, and template-literal import paths**

#### Entry points are never dead

A module whose job is to expose an API has no in-repo importers by design. That is what it is for, not evidence against it. Never report:

- `shell/apis/**` — the composition-API surface for UI extensions. `shell/apis/index.ts` opens with "Main export for APIs" and exists precisely so that out-of-tree extensions can import from `@shell/apis`
- Anything reachable as a package entry: `main`, `types` or `exports` in a `package.json`, and the `entry` lists in build or tooling config
- `shell/initialize/entry.js`, `shell/config/router/routes.js`, store/plugin/directive registration files, and the `pkg/*/index.ts` extension entry points

A previous run filed an issue against three `shell/apis/index.ts` re-exports, marked it **Confidence: High**, and then opened its own removal steps with "verify with the team whether this is an external extension API". Those two statements cannot both stand. **An unresolved question about intent caps confidence below the reporting threshold** — resolve it or drop the finding. Do not outsource the verification to the reader by filing it anyway.

#### Published package surface

`shell/package.json` publishes `@rancher/shell` with `"files": ["**/*"]`. Every file under `shell/` ships to npm and can be imported by an out-of-tree UI extension as `@shell/...`. A repository-wide search cannot prove those consumers do not exist.

- Do not write "not part of any public extension API" about a file under `shell/`
- Instead state that the file is unreferenced *in this repository*, and that removing it changes the published `@shell/*` surface
- This is not a reason to skip the finding — a component abandoned for years is still worth removing — it is a reason to describe it accurately and to add a release-note item to the removal steps

#### Transitive closure

Dead code arrives in chains, and reporting only the leaves understates the cluster:

1. Read the imports of each confirmed-dead file
2. For every in-repo module it imports, re-run the reference check while treating the already-confirmed-dead files as if they had been deleted
3. Anything whose only remaining consumers are dead is dead too — add it to the cluster, then repeat until the set stops growing
4. Work upwards as well: if a candidate's only importer is itself unreferenced, that importer belongs in the same cluster

**A consumer only exonerates a file if the consumer is itself reachable.** Finding one importer and stopping there is the most common way this check fails. Before concluding "X is still used by Y", run the reference check on Y.

A previous run reported four orphaned components under `shell/components/graph/` and explicitly cleared a fifth, writing: "`HalfCircle.vue` references `./Circle` but `Circle.vue` itself is used by `CountGauge.vue` — only `HalfCircle.vue` can be safely removed." `CountGauge.vue` has no consumers of its own. One more check would have shown that `Circle.vue`, `CountGauge.vue` and `GradientBox.vue` were all dead, along with `Glance.vue` above them — eight files, not four, and a "do NOT remove" instruction that pointed at dead code.

#### Age evidence

Cheap to gather, and the strongest available signal that code was abandoned rather than added recently and not yet wired up:

- `git log -1 --format="%ad %h %s" --date=short -- <file>` for the last change to each file
- `git log --oneline -S "<symbol>" -- .` to find the commit where the last usage disappeared

Include both in the issue. A component whose last consumer was deleted years ago is a far safer removal than one added last month, and the dates let a reviewer judge that without repeating the work.

**Historical Context Patterns** — different removal patterns indicate different confidence levels:

- **Explicit replacement**: Search git history for the component name in config files: `git log -p --all -S "ComponentName" -- "shell/config/" "pkg/"`. If you find a commit that changed `formatter: 'OldComponent'` to `formatter: 'NewComponent'`, that's **very high confidence** — the old component was intentionally replaced.

- **Orphaned by package removal**: Check if the component was part of a removed package: `git log --all --oneline -- "**/ComponentName.vue"` then check if its parent directory/package was deleted. Example: `git log -p --all -S "ComponentName" -- "pkg/removed-package/"`. If the only usage was in a package that was later removed, that's **high confidence** with clear provenance.

- **Never used**: If git history shows no usage in config files (`git log -p --all -S "ComponentName" -- "shell/config/" "pkg/"`returns empty), the component may have been speculative, incomplete, or migrated from another codebase. This is **medium confidence** — safe to remove but requires runtime testing to confirm no dynamic string-based references exist.

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
- **Confidence**: How certain you are the code is truly unreferenced (only report high-confidence findings)
  - **Very High (95%+)**: Git history shows explicit replacement (old component → new component in same config file)
  - **High (85-95%)**: Component was only used in a package/feature that was later removed (verifiable via git history)
  - **Medium (70-85%)**: No references found anywhere (current code or git history), but component could theoretically be used via dynamic string resolution or external extensions
  - **Low (<70%)**: Component has unclear provenance, recent changes, or potential dynamic resolution patterns — DO NOT report these
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
- **Covered but wrong or incomplete** — do not file a corrected duplicate. Add a comment to the existing issue with the correction, and if commenting is unavailable, put it in the run summary instead
- **Genuinely new** — file it, and name in the body which existing issues you checked against

Between 31 July and 5 August 2026 this workflow filed 21 issues covering roughly six distinct clusters. The `shell/components/graph/` components were reported four separate times, the formatter components three times, and the empty `shell/utils/fleet-types.ts` three times. Re-reporting is the single largest source of noise in this workflow's output — treat a duplicate as a defect on the same level as a false positive.

#### Cluster boundaries

Successive runs have split the same underlying findings three ways one day and bundled eighteen unrelated components into a single issue the next. Apply a fixed rule so the boundary does not drift between runs:

- A cluster is **one directory, plus whatever its members transitively drag in**. `shell/components/graph/` is one cluster; `shell/components/formatter/` is another; loose files directly under `shell/components/` are a third
- Never file one issue spanning several unrelated directories merely because everything in it is an unreferenced component. "18 unreferenced components across the codebase" is a report, not a cluster, and it cannot become a clean PR
- Do not split a single directory across multiple issues either
- Derive every count and total from the list you are about to publish rather than estimating. One issue announced "9 files, ~1,870 lines" directly above a list of 11 files totalling 2,014 lines

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

- Exported functions, constants, classes, or types with no importers
- Vue components never referenced in templates, routes, or dynamic imports
- Utility functions with no callers
- Route definitions pointing to non-existent components
- Translation (i18n) keys never referenced
- Whole files that are no longer imported anywhere

### Skip These Patterns

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

### Example Analysis: Formatter Components

Real-world example demonstrating the verification patterns (from issue #19):

**Component: `DelayedValue.vue`** (Very High Confidence)
```bash
# Check current usage
grep -r "DelayedValue" shell/config pkg --include="*.js" --include="*.ts"
# Result: No matches

# Check git history for usage
git log -p --all -S "DelayedValue" -- "shell/config/table-headers.js"
# Result: Shows it was added in June 2022 (commit cab999d02f) as formatter for Pod Restarts
# Result: Shows it was REPLACED in July 2022 (commit 609f73918d):
#   -  formatter:    'DelayedValue',
#   +  formatter:    'LivePodRestarts',
# Conclusion: Very high confidence — explicitly replaced, safe to remove
```

**Component: `ImagePercentageBar.vue`** (High Confidence)
```bash
# Check current usage
grep -r "ImagePercentageBar" shell/config pkg --include="*.js" --include="*.ts"
# Result: No matches

# Check git history
git log -p --all -S "ImagePercentageBar" -- "pkg/"
# Result: Used in pkg/harvester/config/table-headers.js for IMAGE_PROGRESS formatter
# Result: Entire pkg/harvester/ directory was removed in commit 34cbd6d66a (Jan 2024)
# Conclusion: High confidence — orphaned by Harvester package removal
```

**Component: `LinkDetailImage.vue`** (Medium Confidence)
```bash
# Check current usage
grep -r "LinkDetailImage" shell/config pkg --include="*.js" --include="*.ts"
# Result: No matches

# Check git history
git log -p --all -S "LinkDetailImage" -- "shell/config/" "pkg/"
# Result: No usage found in any config file in entire git history
# Conclusion: Medium confidence — never used, but could be referenced via string name
# Note: Component is auto-registered via require.context, could be used by external extensions
# Recommendation: Remove but include runtime testing in removal checklist
```

**Key Takeaway**: Even components that are auto-registered globally (via `require.context`) can be dead code if they're never referenced by name in any config file, template, or external integration point. Use git history to distinguish between "never used" (medium confidence) vs "explicitly replaced" (very high confidence) vs "orphaned by removal" (high confidence).

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

For each component, document its provenance to justify confidence level:

- **Replacement pattern** (if applicable): Show git commit where `ComponentName` was replaced by another component in config files. Example: `git show abc123 -- shell/config/table-headers.js` showing `formatter: 'Old'` → `formatter: 'New'`. This indicates **very high confidence** for removal.

- **Orphaned by removal** (if applicable): Show that the component was only used in a package/directory that was later deleted. Example: Component was in `pkg/harvester/config/table-headers.js` using `formatter: 'ImagePercentageBar'`, then `pkg/harvester/` was removed in commit `34cbd6d66a` (January 2024). This indicates **high confidence** with clear audit trail.

- **Never used** (if applicable): Git history search `git log -p --all -S "ComponentName" -- "shell/config/" "pkg/"` returns no usage in config files. Component may have been speculative, incomplete, or migrated without usage. This indicates **medium confidence** — removal is likely safe but requires runtime testing.

Include the specific git commands run and their outputs to support the confidence assessment.

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
