---
name: Dead Code Detector
description: Identifies unused/dead code in the codebase and suggests removal opportunities
on:
  workflow_dispatch:
  schedule: daily

if: github.repository_owner == 'rancher' || vars.ENABLE_AGENTIC_WORKFLOWS == 'true'

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

Analyze code to identify unused/dead code using static analysis. Report significant findings that warrant removal.

## Task

Detect and report dead code by:

1. **Analyzing Recent Commits**: Review changes in the latest commits
2. **Detecting Dead Code**: Identify unused variables, functions, imports, components, and exports using static analysis
3. **Reporting Findings**: Create a detailed issue if significant dead code is detected (threshold: >5 lines or 3+ unused symbols)

## Context

- **Repository**: ${{ github.repository }}
- **Commit ID**: ${{ github.event.head_commit.id }}
- **Triggered by**: @${{ github.actor }}

## Analysis Workflow

### 1. Changed Files Analysis

Identify and analyze modified files:
- Determine files changed in the recent commits using `git log` and `git diff`
- Focus on source code files (TypeScript, JavaScript, Vue)
- **Exclude test files** from analysis (files matching patterns: `*_test.*`, `*.test.*`, `*.spec.*`, `test_*.*`, or located in directories named `test`, `tests`, `__tests__`, or `spec`)
- **Exclude generated files** and build artifacts
- **Exclude workflow files** from analysis (files under `.github/workflows/*`)
- Use code exploration tools to understand file structure
- Read modified file contents to examine changes

### 2. Dead Code Detection

Apply analysis to find dead code:

**Pattern Search**:
- Search for dead code indicators using grep and code search:
  - Exported functions/variables never imported elsewhere
  - Imported symbols never used in the file
  - Declared but unreferenced variables or constants
  - Vue components defined but never registered or used
  - Unreachable code blocks (after `return`, `throw`, etc.)
  - Deprecated or commented-out code blocks left behind
- Look for functions defined but never called
- Identify TypeScript types/interfaces declared but never referenced

**Semantic Analysis**:
- Compare export lists against import usage across the codebase
- Detect Vue components in a file's `components:` option that are never used in the template
- Check for CSS/SCSS rules that have no matching elements
- Look for feature flags or configuration values that are never read

### 3. Dead Code Evaluation

Assess findings to identify true dead code:

**Dead Code Types**:
- **Unused Imports**: Symbols imported but never referenced in the file
- **Unreferenced Exports**: Functions/variables exported but never imported elsewhere
- **Unreachable Code**: Code that can never be executed due to control flow
- **Unused Variables**: Local variables assigned but never read
- **Obsolete Components**: Vue components declared/registered but never rendered
- **Stale Feature Flags**: Configuration keys defined but never consumed

**Assessment Criteria**:
- **Severity**: Amount of dead code (lines of code, number of symbols)
- **Impact**: Where dead code resides (critical paths, shared utilities)
- **Risk**: Whether removal could break anything (consider dynamic imports, reflection)
- **Removal Opportunity**: Whether dead code can be safely deleted

### 4. Issue Reporting

Create separate issues for each distinct dead code pattern found (maximum 3 patterns per run). Each pattern should get its own issue to enable focused remediation.

**When to Create Issues**:
- Only create issues if significant dead code is found (threshold: >5 lines of dead code OR 3+ unused symbols)
- **Create one issue per distinct dead code pattern** - do NOT bundle multiple patterns in a single issue
- Limit to the top 3 most significant patterns if more are found
- Use the `create_issue` tool from safe-outputs MCP **once for each pattern**

**Issue Contents for Each Pattern**:
- **Executive Summary**: Brief description of this specific dead code pattern
- **Dead Code Details**: Specific locations and code blocks for this pattern only
- **Severity Assessment**: Impact and risk concerns for this pattern
- **Removal Recommendations**: Suggested approach to safely remove this pattern
- **Code Examples**: Concrete examples with file paths and line numbers for this pattern

## Detection Scope

### Report These Issues

- Exported functions that are never imported elsewhere in the codebase
- Imported symbols that are declared but never used in the file
- Vue components registered in `components:` but absent from the template
- Variables or constants declared but never read
- Unreachable code after return/throw statements
- Entire files that appear to have no consumers

### Skip These Patterns

- Standard boilerplate code (index re-exports, type augmentations)
- Test setup/teardown code (acceptable in tests)
- **All test files** (files matching: `*_test.*`, `*.test.*`, `*.spec.*`, `test_*.*`, or in `test/`, `tests/`, `__tests__/`, `spec/` directories)
- **All workflow files** (files under `.github/workflows/*`)
- Code that is dynamically imported or used via reflection
- Polyfills and shims required for browser compatibility
- Code explicitly marked with `// @keep` or similar annotations
- Generated code or vendored dependencies

### Analysis Depth

- **Primary Focus**: Files changed in recent commits (excluding test files and workflow files)
- **Secondary Analysis**: Check for dead code consumers across the repository
- **Cross-Reference**: Look for export/import patterns across the codebase
- **Historical Context**: Consider if dead code was intentionally preserved

## Issue Template

For each distinct dead code pattern found, create a separate issue using this structure:

````markdown
# 🗑️ Dead Code Detected: [Pattern Name]

*Analysis of commit ${{ github.event.head_commit.id }}*

**Assignee**: @copilot

## Summary

[Brief overview of this specific dead code pattern]

## Dead Code Details

### Pattern: [Description]
- **Severity**: High/Medium/Low
- **Occurrences**: [Number of instances]
- **Locations**:
  - `path/to/file1.ext` (lines X-Y)
  - `path/to/file2.ext` (lines A-B)
- **Code Sample**:
  ````[language]
  [Example of dead code]
  ````

## Impact Analysis

- **Maintainability**: [How this dead code affects maintenance]
- **Bundle Size**: [Potential impact on bundle size]
- **Confusion Risk**: [Risk of future developers relying on dead code]

## Removal Recommendations

1. **[Recommendation 1]**
   - Safely remove: `path/to/file.ext` lines X-Y
   - Estimated effort: [hours/complexity]
   - Benefits: [specific improvements]

2. **[Recommendation 2]**
   [... additional recommendations ...]

## Implementation Checklist

- [ ] Review dead code findings
- [ ] Verify code is truly unused (check dynamic imports, reflection)
- [ ] Remove identified dead code
- [ ] Update tests if needed
- [ ] Verify no functionality broken

## Analysis Metadata

- **Analyzed Files**: [count]
- **Detection Method**: Static code analysis
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
- Use static analysis for meaningful dead code, not superficial matches
- Stay within timeout limits (balance thoroughness with execution time)

### Accuracy
- Verify findings before reporting (check for dynamic usage patterns)
- Distinguish between truly unused code and conditionally used code
- Consider TypeScript declaration merging and module augmentation
- Provide specific, actionable recommendations

### Issue Creation
- Create **one issue per distinct dead code pattern** - do NOT bundle multiple patterns in a single issue
- Limit to the top 3 most significant patterns if more are found
- Only create issues if significant dead code is found
- Include sufficient detail for coding agents to understand and act on findings
- Provide concrete examples with file paths and line numbers
- Suggest safe removal approaches
- Assign issue to @copilot for automated remediation
- Use descriptive titles that clearly identify the specific pattern (e.g., "Dead Code: Unused exports in utility module")

**Objective**: Improve code quality by identifying and reporting meaningful dead code that impacts bundle size and maintainability. Focus on actionable findings that enable automated or manual cleanup.
