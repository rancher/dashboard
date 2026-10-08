#!/usr/bin/env node

/**
 * PR check: a PR must either declare which issues it fixes (e.g. `Fixes #1234`)
 * or have a label that allows it to proceed without one (QA/None, area/dependencies).
 *
 * Runs from a `pull_request` triggered workflow so that a failure shows as a check on the PR.
 *
 * Env:
 * - GITHUB_EVENT_PATH: path to the pull_request event (set by GitHub Actions)
 */

const QA_NONE_LABEL = 'QA/None';

// This label is used so that PRs from dependabot don't fail the check for 'fixes' notation
const GH_DEPENDENCIES_LABEL = 'area/dependencies';

const ALLOW_UNLINKED_LABELS = [QA_NONE_LABEL, GH_DEPENDENCIES_LABEL];

function getReferencedIssues(body) {
  // https://docs.github.com/en/github/managing-your-work-on-github/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
  // Handle both Fixes #NNNN and Fixes https://github.com/rancher/dashboard/issuues/NNNN
  const regexp = /[Ff]ix(es|ed)?\s*(#|https:\/\/github\.com\/rancher\/dashboard\/issues\/)([0-9]*)|[Cc]lose(s|d)?\s*(#|https:\/\/github\.com\/rancher\/dashboard\/issues\/)([0-9]*)|[Rr]esolve(s|d)?\s*(#|https:\/\/github\.com\/rancher\/dashboard\/issues\/)([0-9]*)/g;
  var v;
  const issues = [];
  do {
    v = regexp.exec(body);
    if (v) {
      // Matches - 0 = Full string, then for each of fix, close and resolve: suffix, # or https://github.com/rancher/dashboard/issuues/, issue number
      // So the issue number is in 3 (fix), 6 (close) or 9 (resolve)
      const vNumber = parseInt(v[3] || v[6] || v[9], 10);

      if (!isNaN(vNumber)) {
        issues.push(vNumber);
      }
    }
  } while (v);
  return issues;
}

function hasLabel(issue, label) {
  const labels = issue.labels || [];

  return !!(labels.find(l => l.name.toLowerCase() === label.toLowerCase()));
}

/**
 * Returns whether the PR passes the check and a message explaining why
 */
function checkLinkedIssue(pr) {
  const issues = getReferencedIssues(pr.body || '');

  if (issues.length > 0) {
    return { ok: true, message: `This PR fixes issues: #${ issues.join(', #') }` };
  }

  const allowedBy = ALLOW_UNLINKED_LABELS.find(l => hasLabel(pr, l));

  if (allowedBy) {
    return { ok: true, message: `This PR does not fix any issues, allowing it to proceed because it has the '${ allowedBy }' label` };
  }

  return { ok: false, message: `Error: A PR MUST either declare which issues it fixes (e.g. 'Fixes #1234') OR must have the '${ QA_NONE_LABEL }' label` };
}

if (require.main === module) {
  const event = require(process.env.GITHUB_EVENT_PATH);
  const { ok, message } = checkLinkedIssue(event.pull_request);

  console.log(message);

  if (!ok) {
    process.exit(1);
  }
}

module.exports = {
  QA_NONE_LABEL,
  getReferencedIssues,
  hasLabel,
  checkLinkedIssue,
};
