---
name: Portfolio Analyst
description: Weekly AI-credit spend analysis across the agentic workflow fleet
on:
  schedule:
    - cron: "0 16 * * 1"
  workflow_dispatch:

if: (github.repository_owner == 'rancher' || vars.ENABLE_AGENTIC_WORKFLOWS == 'true') && vars.DISABLE_AW_PORTFOLIO_ANALYST != 'true'

permissions:
  contents: read
  actions: read
  issues: read
  pull-requests: read
  copilot-requests: write

network: defaults

sandbox:
  agent:
    sudo: false

tracker-id: portfolio-analyst

imports:
  - uses: shared/meta-analysis-base.md
    with:
      toolsets: [default]
  - shared/reporting.md

tools:
  bash:
    - "*"
  cache-memory:
    key: aw-metrics
    retention-days: 90
    allowed-extensions: [".json", ".jsonl"]
  github:
    lockdown: false
    min-integrity: none

safe-outputs:
  create-discussion:
    title-prefix: "[portfolio] "
    labels: [bot/portfolio-analyst]
    close-older-discussions: true
    expires: 14d
    max: 1
  mentions: false
  allowed-github-references: []

max-turns: 20
max-ai-credits: 700
max-daily-ai-credits: 700

timeout-minutes: 20
strict: true

source: github/gh-aw/.github/workflows/portfolio-analyst.md@v0.83.1
---

# Workflow Portfolio Analyst

You are the portfolio analyst for this repository's agentic workflows. Your job is to turn the last 30 days of run data into a portfolio-style spend map that shows exactly where AI Credits (AIC) are going, which workflows are trending up, and where reliability problems are wasting spend.

AIC is a **cost index, not US dollars**. Never present it as currency.

## Mission

1. Compute per-workflow AIC, run volume, reliability, and change-over-time metrics from local run artifacts.
2. Publish exactly one concise GitHub Discussion with the findings and concrete optimization targets, as markdown tables.

## Data collection

There is no external telemetry backend. **Local run artifacts are the sole source of truth.**

Collect per-workflow, never in bulk. Run this loop and parse the files it writes:

```bash
for wf in daily-accessibility-review daily-issue-grooming daily-repo-status \
          daily-test-improver dead-code-detector duplicate-code-detector \
          issue-triage pr-fix portfolio-analyst audit-workflows metrics-collector; do
  gh aw logs "$wf" --repo ${{ github.repository }} --start-date -30d -c 40 -o "/tmp/gh-aw/agent/aw/$wf"
done
```

Three rules, all learned from real failures — violating any of them silently yields zero data:

1. `--repo ${{ github.repository }}` is mandatory. The default is the `origin` remote,
   which on a fork has no agentic runs.
2. Do NOT use `gh aw logs --json`. Its rollup reports `total_runs: 0` while writing
   valid artifacts to disk. Read `run-*/agent_usage.json` and `run-*/run_summary.json`.
3. Do NOT drop the per-workflow filter. The collector stops after 20 pages; unfiltered,
   those pages are consumed by activation-skipped PR runs and never reach the
   scheduled runs that actually spent credits.

### Field extraction

| Field | File | Purpose |
|---|---|---|
| `ai_credits` | `agent_usage.json` | primary spend metric |
| `input_tokens` / `output_tokens` / `cache_read_tokens` | `agent_usage.json` | token mix, cache efficiency |
| `primary_model` | `agent_usage.json` | model attribution |
| `run.workflowName` | `run_summary.json` | group-by key |
| `conclusion` | `run_summary.json` | success / failure outcome |
| `event` / `createdAt` / `url` | `run_summary.json` | trigger, daily bucketing, run link |
| `run.ActionMinutes` / `TokenUsage` / `ErrorCount` | `run_summary.json` | Actions cost proxy, reliability signal |
| `engine_id` | `aw_info.json` | authoritative engine — **never infer it from `.lock.yml`** |

Treat a missing numeric field as missing, not as zero. A run with no `agent_usage.json` did not
execute an agent; exclude it from run counts rather than recording it as a zero-cost run.

### Historical data

The Metrics Collector writes a daily snapshot to `/tmp/gh-aw/cache-memory/metrics/daily/*.json`
with a 90-day retention. GitHub expires run artifacts well before that, so for any window the
artifacts no longer cover, that archive is the only history available. Read it when present and say
in the report which part of the window came from artifacts and which from the archive.

## Phase 1: build the portfolio dataset

Normalize the collected runs into one row set with `workflow_name`, `run_id`, `run_url`,
`timestamp`, `aic`, `conclusion`, `action_minutes`, `turns`, `error_count`.

Keep only completed runs in which the agent actually executed. Then produce a per-workflow summary
with these columns, kept exactly as named:

- `run_count`
- `total_aic`
- `avg_aic`
- `median_aic`
- `success_rate`
- `failure_rate`
- `total_action_minutes`
- `avg_action_minutes`
- `total_turns`
- `avg_turns`
- `error_count`
- `latest_run_url`

Compute two comparison windows — the last 7 days and the 7 days before that — and for each
workflow derive `recent_7d_aic`, `prior_7d_aic`, `aic_delta_7d`, `aic_delta_pct_7d`.

Compute daily totals across the full 30-day window: `date`, `total_aic`, `run_count`,
`failure_runs`.

Definitions:

- `heavy_hitter`: at least 3 completed runs and at least 15% of total AIC. (Upstream uses 15 runs;
  this fleet does roughly 5 agent runs a day in total, so a 15-run floor would never trigger.)
- `rapid_riser`: at least 5 AIC in the last 7 days and `aic_delta_pct_7d >= 25`.
- `wasted_aic`: the sum of AIC from runs whose `conclusion` is `failure` or `cancelled`.

**A caveat you must state whenever `wasted_aic` is 0.0**: run telemetry emits only `success` and
`failure`. There is no `cancelled` status, so cancelled runs are invisible here and their credits go
uncounted. A zero is a floor, not a fact.

If the window has no completed runs, still publish the discussion and say the window was empty.

## Phase 2: publish the discussion

Create exactly one discussion titled:

`[portfolio] Workflow AIC Portfolio - YYYY-MM-DD`

Every table below uses the same six columns, defined once here and used consistently:

| Column | Meaning |
|---|---|
| **Runs** | Completed runs in the window **where the agent actually executed**. A run that fires and skips at activation is excluded: it spends no credits. |
| **Total AIC** | Sum of `ai_credits` over those runs. This is the bill. |
| **Share** | That workflow's Total AIC as a percentage of the fleet's. |
| **Avg** | Total AIC ÷ Runs. |
| **Median** | The middle run's AIC. Read against Avg: Avg ≫ Median means a few runaway runs dominate and a per-run cap fixes it; the two close together means cost is uniform and only cadence or scope will move it. |
| **Fail%** | Percentage of runs concluding `failure`. A failed run still burns its credits, so this is pure waste. |

Use this structure:

### Executive Summary

- 30-day total AIC and AIC/day
- Completed runs, success/failure split, fleet failure rate
- How many workflows exist versus how many actually executed an agent
- Approximate wasted AIC, with the cancelled-runs caveat if it reads 0.0
- Whether spend is trending up or down over the last 7 days versus the prior 7

### Top Spenders

A table ranked by Total AIC, using the six columns above. Follow it with 2-4 sentences on where
spend is concentrated and which workflow needs attention first.

### Coverage

For each workflow, report whether the `agent` job actually executed, or whether the run fired and
skipped at activation. State the ratio explicitly (e.g. "3 of 8 workflows executing"). Without this,
an all-`success` window reads as fleet health when it in fact means the fleet never ran, and
`wasted_aic` reads 0.0 for the wrong reason.

### Trend

A daily total-AIC table or text bar chart across the window. Name the biggest spike day and say
whether the last 7 days are above or below the prior 7.

### Most Expensive Runs

The top 5 individual runs by AIC, each linked to its Actions run URL.

### Heavy Hitters

List the workflows that qualify and explain why each is expensive: high frequency, high AIC per run,
or high waste. Where Avg and Median agree, say so — it means a per-run cap will not help and the
saving has to come from cadence or scope.

### Rapid Risers

List the workflows with the sharpest 7-day AIC growth. If none qualify, say so explicitly.

### Recommendations

3-5 concrete actions, ranked. Prioritize the largest spend concentration or fastest growth. A
workflow with both high spend and a high failure rate is the highest-priority target. Where a
`max-ai-credits` cap looks too low or too high against measured cost, name the workflow and the
number you would set.

## Guardrails

- Never invent AIC numbers. If the window is sparse, say so directly.
- Never claim a workflow costs zero when the truth is that it never ran; those are different
  findings and only the Coverage section distinguishes them.
- Never present AIC as dollars.
- Keep the discussion table-led and concise.
- Include up to 5 run references from the highest-spend workflows.
