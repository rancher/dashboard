#!/usr/bin/env node

/**
 * Weekly Stale Issue Manager (deterministic replacement for the gh-aw workflow).
 *
 * Warns `kind/enhancement` issues inactive for 548+ days with the stale label,
 * then closes them after 7 more inactive days. Idempotent and self-correcting.
 *
 * Env: GH_TOKEN (issues:write + project #57 read), GITHUB_REPOSITORY,
 * STALE_TARGET_LABELS (optional, comma-separated), DRY_RUN ("true" logs only).
 */

const fs = require('fs');
const request = require('./request');

// --- Configuration ---------------------------------------------------------

// Only issues carrying one of these labels are managed by the stalebot (unioned).
const TARGET_LABELS = (process.env.STALE_TARGET_LABELS || 'kind/enhancement').split(',').map((l) => l.trim()).filter(Boolean);

const STALE_LABEL = 'bot/stale-issue-manager/stale';
const CLOSED_LABEL = 'bot/stale-issue-manager/closed';
const JIRA_LABEL = 'JIRA';

const STALE_DAYS = 548;      // ~1.5 years inactive before warning
const CLOSE_AFTER_DAYS = 7;  // grace period after warning before closing

const PROJECT_OWNER = 'rancher';
const PROJECT_NUMBER = 57;

// Project #57 statuses at/beyond "Review": actively worked, never stale (case-insensitive).
const ACTIVE_PROJECT_STATUSES = [
  'review',
  'qa blocked',
  'to test',
  'qa working',
  'qa review',
  'reopened',
  'done',
];

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

// Fail loudly if the project is unreadable rather than silently skip the gate.
async function assertProjectAccess(owner, number) {
  const res = await graphql(`query {
    repositoryOwner(login: "${ owner }") {
      ... on ProjectV2Owner {
        projectV2(number: ${ number }) {
          id
          title
        }
      }
    }
  }`);

  const project = res.data?.repositoryOwner?.projectV2;

  if (!project?.id) {
    throw new Error(`Unable to read project #${ number } owned by ${ owner }. ` +
      'The token is missing project read access; refusing to continue without the project gate.');
  }

  console.log(`Project gate: #${ number } "${ project.title }" (${ project.id })`);

  return project.id;
}

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
// can be stale yet), with project #57 status for cheap filtering. Paginated.
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
            projectItems(first: 20) {
              nodes {
                project {
                  number
                  owner {
                    ... on Organization { login }
                    ... on User { login }
                  }
                }
                status: fieldValueByName(name: "Status") {
                  ... on ProjectV2ItemFieldSingleSelectValue { name }
                }
              }
            }
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

// Returns the issue's project #57 status if it's an active one, else null.
function activeProjectStatus(candidate) {
  const items = candidate.projectItems?.nodes || [];

  for (const item of items) {
    const project = item.project;

    if (project?.number === PROJECT_NUMBER && project?.owner?.login === PROJECT_OWNER) {
      const status = item.status?.name;

      if (status && ACTIVE_PROJECT_STATUSES.includes(status.toLowerCase())) {
        return status;
      }
    }
  }

  return null;
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

async function setLabels(owner, repo, number, labels) {
  if (DRY_RUN) {
    console.log(`    [dry-run] set labels -> ${ labels.join(', ') }`);

    return;
  }

  await request.put(`${ issueApiUrl(owner, repo, number) }/labels`, { labels });
}

async function addComment(owner, repo, number, body) {
  if (DRY_RUN) {
    console.log('    [dry-run] add comment');

    return;
  }

  await request.post(`${ issueApiUrl(owner, repo, number) }/comments`, { body });
}

async function closeIssue(owner, repo, number) {
  if (DRY_RUN) {
    console.log('    [dry-run] close issue (not_planned)');

    return;
  }

  await request.patch(issueApiUrl(owner, repo, number), { state: 'closed', state_reason: 'not_planned' });
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

  await assertProjectAccess(PROJECT_OWNER, PROJECT_NUMBER);

  // Oldest first, for deterministic logs.
  const candidates = (await fetchCandidates(owner, repo)).sort((a, b) => a.number - b.number);

  console.log(`Candidates: ${ candidates.length }`);

  const counts = { labeled: 0, unlabeled: 0, closed: 0, skipped: 0 };

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

    // Skip issues actively worked in project #57.
    const activeStatus = activeProjectStatus(candidate);

    if (activeStatus) {
      console.log(`#${ number }: skip (project #57 status "${ activeStatus }")`);
      counts.skipped++;
      continue;
    }

    const detail = await fetchIssueDetail(owner, repo, number);
    const { isStale, staleLabelAddedDate, activitySinceLabel } = analyze(candidate, detail);

    if (hasStale) {
      if (activitySinceLabel) {
        // Engaged after the warning; revive it.
        console.log(`#${ number }: activity since stale label, removing stale label`);
        await setLabels(owner, repo, number, labels.filter((l) => l !== STALE_LABEL));
        counts.unlabeled++;
      } else if (staleLabelAddedDate && daysAgo(staleLabelAddedDate) >= CLOSE_AFTER_DAYS) {
        // Warned long enough with no activity; close it.
        console.log(`#${ number }: stale for ${ Math.floor(daysAgo(staleLabelAddedDate)) } days, closing`);
        await setLabels(owner, repo, number, [...labels, CLOSED_LABEL]);
        await addComment(owner, repo, number, CLOSE_COMMENT);
        await closeIssue(owner, repo, number);
        counts.closed++;
      } else {
        const waited = staleLabelAddedDate ? Math.floor(daysAgo(staleLabelAddedDate)) : 'unknown';

        console.log(`#${ number }: warned ${ waited } days ago, within grace period, no change`);
      }
    } else if (isStale) {
      // Newly stale; warn it.
      console.log(`#${ number }: newly stale, adding stale label + warning`);
      await setLabels(owner, repo, number, [...labels, STALE_LABEL]);
      await addComment(owner, repo, number, STALE_COMMENT);
      counts.labeled++;
    } else {
      console.log(`#${ number }: active, no change`);
    }
  }

  console.log('======');
  console.log(`Done. labeled=${ counts.labeled } unlabeled=${ counts.unlabeled } ` +
    `closed=${ counts.closed } skipped=${ counts.skipped }`);

  // Job summary.
  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `## Stale Issue Manager\n\n` +
      `- Candidates: ${ candidates.length }\n` +
      `- Labeled stale: ${ counts.labeled }\n` +
      `- Unlabeled (revived): ${ counts.unlabeled }\n` +
      `- Closed: ${ counts.closed }\n` +
      `- Skipped: ${ counts.skipped }\n`);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.stack || err.message || err);
    process.exit(1);
  });
}

module.exports = {
  activeProjectStatus,
  isMeaningfulComment,
  isOwnComment,
  analyze,
  fetchCandidates,
  fetchIssueDetail,
  ACTIVE_PROJECT_STATUSES,
  STALE_LABEL,
  CLOSED_LABEL,
  STALE_DAYS,
  CLOSE_AFTER_DAYS,
};
