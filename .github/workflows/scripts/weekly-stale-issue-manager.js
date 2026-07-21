#!/usr/bin/env node

/**
 * Weekly Stale Issue Manager (deterministic replacement for the gh-aw workflow).
 *
 * Warns `kind/enhancement` issues inactive for 1.5 years (548+ days) with the stale label,
 * then closes them after 7 more inactive days. Idempotent and self-correcting.
 *
 * Env:
 * - GH_TOKEN: token with issues:write (the default GITHUB_TOKEN is enough)
 * - GITHUB_REPOSITORY: "owner/repo"
 * - STALE_TARGET_LABELS: optional, comma-separated (default kind/enhancement)
 * - STALE_MAX_ACTIONS: optional, default 20
 * - DRY_RUN: "true" logs instead of writing
 */

const fs = require('fs');
const https = require('https');
const request = require('./request');

// --- Configuration ---------------------------------------------------------

// Only issues carrying one of these labels are managed by the stalebot (unioned).
const TARGET_LABELS = (process.env.STALE_TARGET_LABELS || 'kind/enhancement').split(',').map((l) => l.trim()).filter(Boolean);

const STALE_LABEL = 'bot/stale-issue-manager/stale';
const CLOSED_LABEL = 'bot/stale-issue-manager/closed';
const JIRA_LABEL = 'JIRA';

const STALE_DAYS = 548;      // ~1.5 years inactive before warning
const CLOSE_AFTER_DAYS = 7;  // grace period after warning before closing

// Max issue-changing actions (mark stale or close) per run; closes go first.
// Reviving and skipping do not count. Leftover work is picked up next run.
const MAX_ACTIONS = Number(process.env.STALE_MAX_ACTIONS) || 20;

const STALE_COMMENT = 'This issue has been automatically marked as stale because it has not had any comments or ' +
  'activity in over 1.5 years. It will be closed if no further activity occurs within the next ' +
  'week. If this is still relevant, please leave a comment explaining why it should remain open.';

const CLOSE_COMMENT = "We're closing this issue because it hasn't been active nor has been prioritized in over 1.5 " +
  'years. If this is still needed in the latest version of Rancher, please re-open and let us ' +
  'know why you think this should be prioritized. Upon this issue being re-opened we\'ll review ' +
  'it and provide an update.';

// Fragments identifying our own comments, whatever bot identity posted them.
const OWN_COMMENT_MARKERS = [
  'automatically marked as stale because it has not had any comments',
  "We're closing this issue because it hasn't been active",
];

const DRY_RUN = process.env.DRY_RUN === 'true';

// --- Helpers ---------------------------------------------------------------

const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(dateStr) {
  return (now - new Date(dateStr).getTime()) / DAY_MS;
}

function isoDaysAgo(days) {
  return new Date(now - days * DAY_MS).toISOString().slice(0, 10);
}

function graphql(query) {
  return request.graphql(query).then((res) => {
    if (res.errors) {
      throw new Error(`GraphQL error: ${ JSON.stringify(res.errors) }`);
    }

    return res;
  });
}

// --- GitHub queries --------------------------------------------------------

// Union of per-label searches, de-duplicated by issue number.
async function fetchCandidates(owner, repo) {
  const byNumber = new Map();

  for (const label of TARGET_LABELS) {
    for (const node of await searchByLabel(owner, repo, label)) {
      byNumber.set(node.number, node);
    }
  }

  return [...byNumber.values()];
}

// Open issues with `label` created before the stale threshold (nothing newer
// can be stale yet). Paginated.
async function searchByLabel(owner, repo, label) {
  const createdBefore = isoDaysAgo(STALE_DAYS);
  const query = `repo:${ owner }/${ repo } is:issue is:open label:\\"${ label }\\" ` +
    `created:<${ createdBefore } sort:created-asc`;

  const nodes = [];
  let after = '';

  for (;;) {
    const res = await graphql(`query {
      search(first: 50, ${ after } type: ISSUE, query: "${ query }") {
        pageInfo { hasNextPage endCursor }
        nodes {
          ... on Issue {
            number
            createdAt
            labels(first: 50) { nodes { name } }
          }
        }
      }
    }`);

    const search = res.data?.search;

    if (!search) {
      throw new Error(`Unexpected search response: ${ JSON.stringify(res) }`);
    }

    nodes.push(...search.nodes);

    if (!search.pageInfo.hasNextPage) {
      break;
    }

    after = `after: "${ search.pageInfo.endCursor }",`;
  }

  return nodes;
}

// Per-issue activity: recent comments plus reopen / label timeline events.
async function fetchIssueDetail(owner, repo, number) {
  const res = await graphql(`query {
    repository(owner: "${ owner }", name: "${ repo }") {
      issue(number: ${ number }) {
        comments(last: 20) {
          nodes {
            createdAt
            body
            author { login __typename }
          }
        }
        timelineItems(last: 100, itemTypes: [REOPENED_EVENT, LABELED_EVENT]) {
          nodes {
            __typename
            ... on ReopenedEvent { createdAt }
            ... on LabeledEvent { createdAt label { name } }
          }
        }
      }
    }
  }`);

  const issue = res.data?.repository?.issue;

  if (!issue) {
    throw new Error(`Unable to fetch detail for issue #${ number }`);
  }

  return issue;
}

// --- Analysis --------------------------------------------------------------

function labelNames(candidate) {
  return (candidate.labels?.nodes || []).map((l) => l.name);
}

function isOwnComment(comment) {
  const body = comment.body || '';

  return OWN_COMMENT_MARKERS.some((marker) => body.includes(marker));
}

function isMeaningfulComment(comment) {
  const author = comment.author;

  if (!author) {
    return false; // deleted account
  }

  if (author.__typename === 'Bot') {
    return false; // bots, including our own comments
  }

  return !isOwnComment(comment);
}

function latestDate(dates) {
  const valid = dates.filter(Boolean).map((d) => new Date(d).getTime());

  return valid.length ? new Date(Math.max(...valid)) : null;
}

// Allocate the per-run action budget: closes first, then marks with what's left.
function planActions(toClose, toMark, maxActions) {
  const closes = toClose.slice(0, Math.max(0, maxActions));
  const marks = toMark.slice(0, Math.max(0, maxActions - closes.length));
  const deferred = (toClose.length - closes.length) + (toMark.length - marks.length);

  return { closes, marks, deferred };
}

// Compute staleness signals from an issue's detail payload.
function analyze(candidate, detail) {
  const comments = detail.comments?.nodes || [];
  const timeline = detail.timelineItems?.nodes || [];

  const lastCommentDate = latestDate(
    comments.filter(isMeaningfulComment).map((c) => c.createdAt)
  );

  const lastReopenDate = latestDate(
    timeline.filter((t) => t.__typename === 'ReopenedEvent').map((t) => t.createdAt)
  );

  // Most recent activity, falling back to creation date.
  const lastActivity = latestDate([lastCommentDate, lastReopenDate, candidate.createdAt]);

  const staleLabelAddedDate = latestDate(
    timeline
      .filter((t) => t.__typename === 'LabeledEvent' && t.label?.name === STALE_LABEL)
      .map((t) => t.createdAt)
  );

  const lastMeaningful = latestDate([lastCommentDate, lastReopenDate]);
  const activitySinceLabel = !!(staleLabelAddedDate && lastMeaningful &&
    lastMeaningful.getTime() > staleLabelAddedDate.getTime());

  return {
    isStale: daysAgo(lastActivity) >= STALE_DAYS,
    staleLabelAddedDate,
    activitySinceLabel,
  };
}

// --- Mutations -------------------------------------------------------------

function issueApiUrl(owner, repo, number) {
  return `https://api.github.com/repos/${ owner }/${ repo }/issues/${ number }`;
}

// REST call that rejects on a non-2xx status. (request.js resolves with the body
// regardless of status, so a 403/422/rate-limit would otherwise look like success.)
function githubRequest(method, url, body) {
  const token = process.env.GH_TOKEN || process.env.TOKEN;
  const payload = body ? JSON.stringify(body) : null;
  const opts = {
    method,
    headers: {
      'User-Agent':    'stale-issue-manager',
      'Authorization': `token ${ token }`,
      'Accept':        'application/vnd.github+json',
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, opts, (res) => {
      const chunks = [];

      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(text ? JSON.parse(text) : {});
        } else {
          reject(new Error(`${ method } ${ url } -> HTTP ${ res.statusCode }: ${ text }`));
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
}

// POST merges labels onto the issue; it never overwrites labels a human or
// another bot may have added since the search snapshot was taken.
async function addLabels(owner, repo, number, labels) {
  if (DRY_RUN) {
    console.log(`    [dry-run] add labels -> ${ labels.join(', ') }`);

    return;
  }

  await githubRequest('POST', `${ issueApiUrl(owner, repo, number) }/labels`, { labels });
}

// DELETE removes a single label, leaving the rest untouched.
async function removeLabel(owner, repo, number, label) {
  if (DRY_RUN) {
    console.log(`    [dry-run] remove label -> ${ label }`);

    return;
  }

  await githubRequest('DELETE', `${ issueApiUrl(owner, repo, number) }/labels/${ encodeURIComponent(label) }`);
}

async function addComment(owner, repo, number, body) {
  if (DRY_RUN) {
    console.log('    [dry-run] add comment');

    return;
  }

  await githubRequest('POST', `${ issueApiUrl(owner, repo, number) }/comments`, { body });
}

async function closeIssue(owner, repo, number) {
  if (DRY_RUN) {
    console.log('    [dry-run] close issue (not_planned)');

    return;
  }

  await githubRequest('PATCH', issueApiUrl(owner, repo, number), { state: 'closed', state_reason: 'not_planned' });
}

// --- Main ------------------------------------------------------------------

async function main() {
  if (!(process.env.GH_TOKEN || process.env.TOKEN)) {
    throw new Error('You must set a GitHub token in the GH_TOKEN environment variable');
  }

  const repository = process.env.GITHUB_REPOSITORY;

  if (!repository || !repository.includes('/')) {
    throw new Error('GITHUB_REPOSITORY must be set to "owner/repo"');
  }

  const [owner, repo] = repository.split('/');

  console.log(`Stale Issue Manager for ${ owner }/${ repo }${ DRY_RUN ? ' (dry-run)' : '' }`);

  // Oldest first, for deterministic logs.
  const candidates = (await fetchCandidates(owner, repo)).sort((a, b) => a.number - b.number);

  console.log(`Candidates: ${ candidates.length }`);

  const counts = { labeled: 0, unlabeled: 0, closed: 0, skipped: 0 };

  // First pass: classify. Reviving and skipping are unbudgeted, so they happen
  // now; closing and marking are queued and run under MAX_ACTIONS below.
  const toClose = [];
  const toMark = [];

  for (const candidate of candidates) {
    const number = candidate.number;

    const labels = labelNames(candidate);
    const hasStale = labels.includes(STALE_LABEL);

    // Never touch customer-originated JIRA issues.
    if (labels.includes(JIRA_LABEL)) {
      console.log(`#${ number }: skip (JIRA label)`);
      counts.skipped++;
      continue;
    }

    const detail = await fetchIssueDetail(owner, repo, number);
    const { isStale, staleLabelAddedDate, activitySinceLabel } = analyze(candidate, detail);

    if (hasStale) {
      if (activitySinceLabel) {
        // Engaged after the warning; revive it (unbudgeted).
        console.log(`#${ number }: activity since stale label, removing stale label`);
        try {
          await removeLabel(owner, repo, number, STALE_LABEL);
          counts.unlabeled++;
        } catch (e) {
          console.error(`#${ number }: failed to remove stale label: ${ e.message }`);
        }
      } else if (staleLabelAddedDate && daysAgo(staleLabelAddedDate) >= CLOSE_AFTER_DAYS) {
        toClose.push({ number, staleLabelAddedDate });
      } else {
        const waited = staleLabelAddedDate ? Math.floor(daysAgo(staleLabelAddedDate)) : 'unknown';

        console.log(`#${ number }: warned ${ waited } days ago, within grace period, no change`);
      }
    } else if (isStale) {
      toMark.push({ number });
    } else {
      console.log(`#${ number }: active, no change`);
    }
  }

  // Second pass: spend the action budget. Closes first, then marks.
  const { closes, marks, deferred } = planActions(toClose, toMark, MAX_ACTIONS);

  for (const { number, staleLabelAddedDate } of closes) {
    console.log(`#${ number }: stale for ${ Math.floor(daysAgo(staleLabelAddedDate)) } days, closing`);
    // Close first: if it fails we throw before commenting, so a failed run never
    // leaves a close comment on a still-open issue (which would duplicate next run).
    try {
      await closeIssue(owner, repo, number);
      await addLabels(owner, repo, number, [CLOSED_LABEL]);
      await addComment(owner, repo, number, CLOSE_COMMENT);
      counts.closed++;
    } catch (e) {
      console.error(`#${ number }: close failed, will retry next run: ${ e.message }`);
    }
  }

  for (const { number } of marks) {
    console.log(`#${ number }: newly stale, adding stale label + warning`);
    try {
      await addLabels(owner, repo, number, [STALE_LABEL]);
      await addComment(owner, repo, number, STALE_COMMENT);
      counts.labeled++;
    } catch (e) {
      console.error(`#${ number }: mark failed, will retry next run: ${ e.message }`);
    }
  }

  if (deferred > 0) {
    console.log(`Action budget ${ MAX_ACTIONS } reached; ${ deferred } action(s) deferred to next run.`);
  }

  console.log('======');
  console.log(`Done. labeled=${ counts.labeled } unlabeled=${ counts.unlabeled } ` +
    `closed=${ counts.closed } skipped=${ counts.skipped } deferred=${ deferred }`);

  // Job summary.
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## Stale Issue Manager\n\n` +
      `- Candidates: ${ candidates.length }\n` +
      `- Labeled stale: ${ counts.labeled }\n` +
      `- Unlabeled (revived): ${ counts.unlabeled }\n` +
      `- Closed: ${ counts.closed }\n` +
      `- Skipped: ${ counts.skipped }\n` +
      `- Deferred (over ${ MAX_ACTIONS }-action budget): ${ deferred }\n`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.stack || err.message || err);
    process.exit(1);
  });
}

module.exports = {
  isMeaningfulComment,
  isOwnComment,
  planActions,
  analyze,
  fetchCandidates,
  fetchIssueDetail,
  STALE_LABEL,
  CLOSED_LABEL,
  STALE_DAYS,
  CLOSE_AFTER_DAYS,
};
