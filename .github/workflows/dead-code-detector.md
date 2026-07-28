---
name: Dead Code Detector
description: Identifies dead and unused code across the codebase and suggests safe removal opportunities
on:
  workflow_dispatch:
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
3. **Reporting Findings**: Create a detailed issue if significant dead code is detected (threshold below)

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
- Account for components resolved dynamically (e.g. via `resolveComponent`, `defineAsyncComponent`, string-keyed lookups, or the Rancher model/registry mechanisms)

**Unreferenced utility functions**:
- Functions in `shell/utils/` (and equivalent util directories) with no callers anywhere in the codebase

**Dead routes**:
- Route definitions pointing to page components that no longer exist

**Unused i18n keys**:
- Keys in locale files (e.g. `shell/assets/translations/en-us.yaml`) that are never referenced in templates or JS/TS via `t('...')`, `i18n-t`, `v-t`, or similar
- Be conservative: keys may be constructed dynamically (string concatenation, interpolation). Only report keys with a static, obviously-unused prefix path

### 3. Dead Code Evaluation

Assess findings to distinguish true dead code from intentional or dynamically-referenced code:

**Dead Code Types**:
- **Unused Exports**: Exported symbols with zero importers
- **Orphaned Files**: Whole files/components no longer referenced anywhere
- **Unreachable Code**: Code paths that can never execute
- **Dead Routes**: Route entries whose targets are gone
- **Unused i18n Keys**: Translation keys with no consumers

**Assessment Criteria**:
- **Confidence**: How certain you are the code is truly unreferenced (only report high-confidence findings)
- **Severity**: Amount of dead code (lines, number of symbols/files)
- **Impact**: Maintenance burden and codebase bloat removed by deletion
- **Safety**: Whether removal is safe (no dynamic references, no public/extension API surface)

### 4. Issue Reporting

Create separate issues for each distinct category or cluster of dead code found (maximum 3 per run). Each issue should be focused enough to enable a clean removal PR.

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

- Public/extension API surface intended for external consumption (e.g. exports re-exported from package entry points, plugin/extension APIs)
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
- **Historical Context**: Consider whether the code was recently added (possibly not yet wired up) versus genuinely abandoned

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

## Impact Analysis

- **Maintainability**: [How removal reduces maintenance burden]
- **Code Bloat**: [Lines/files removed]
- **Safety**: [Why removal is safe — no dynamic references, not public API]

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
- [ ] Update barrel files / re-exports
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
- Account for dynamic references, re-exports, barrel files, and extension/public API surface
- Consider Vue and Rancher-specific idioms (model/registry auto-registration, dynamic component resolution)
- Provide the exact search evidence that proves each item is dead

### Issue Creation
- Create **one issue per distinct dead-code cluster** — do NOT bundle unrelated findings in a single issue
- Limit to the top 3 most significant clusters if more are found
- Only create issues if significant, high-confidence dead code is found
- Include sufficient detail for coding agents to understand and act on findings
- Provide concrete file paths, line numbers, and verification evidence
- Assign issue to @copilot for automated remediation
- Use descriptive titles that clearly identify the specific cluster (e.g., "Dead Code: Unused Exports in Formatter Utils")

**Objective**: Improve code quality by identifying and reporting genuinely dead code that can be safely removed. Prioritize high-confidence, actionable findings over exhaustive coverage.
