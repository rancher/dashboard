#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * CI Failure Inspector — standalone entrypoint.
 * Queries Jenkins for today's failing tests and creates/updates GitHub issues.
 *
 * Flow:
 *   1. JenkinsClient finds the anchor build and collects all failing tests from today's batch
 *   2. Failures are grouped by test title (same test failing in multiple envs = one issue)
 *   3. For each unique failure, GitHubClient creates a new issue, reopens a closed one,
 *      or skips it if an open issue already exists
 *   4. New issues are added to the UI Automation project board under Backlog
 *
 * See README.md for required and optional environment variables.
 */

import { JenkinsClient } from './jenkins-client.js';
import GitHubClient from './github-client.js';
import { sendHighFailureAlert } from './slack-client.js';
import { AIClient } from './ai-client.js';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GH_PROJECT_TOKEN = process.env.GH_PROJECT_TOKEN;
const JENKINS_AUTH = process.env.JENKINS_AUTH;
const JENKINS_URL = process.env.JENKINS_BASE_URL;

if (!GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN env var is required');
  process.exit(1);
}
if (!GH_PROJECT_TOKEN) {
  console.error('ERROR: GH_PROJECT_TOKEN env var is required');
  process.exit(1);
}
if (!JENKINS_AUTH) {
  console.error('ERROR: JENKINS_AUTH env var is required');
  process.exit(1);
}
if (!JENKINS_URL) {
  console.error('ERROR: JENKINS_BASE_URL env var is required');
  process.exit(1);
}

const jenkinsClient = new JenkinsClient(JENKINS_AUTH);
const githubClient = new GitHubClient(GITHUB_TOKEN, GH_PROJECT_TOKEN);
const aiClient = new AIClient(process.env.COPILOT_TOKEN);

function groupFailures(failures) {
  // Group by testTitle so the same test failing across multiple environments
  // results in a single issue with all environments listed
  const grouped = new Map();

  for (const f of failures) {
    const title = githubClient._issueTitle(f);

    if (!grouped.has(title)) grouped.set(title, { ...f, environments: [] });
    if (f.environment) grouped.get(title).environments.push(f.environment);
  }

  return grouped;
}

async function groupAndCreateIssues(failures, existingIssues) {
  const grouped = groupFailures(failures);

  // Fetch project board members to detect open issues missing from the board
  try {
    const projectNodeIds = await githubClient.fetchProjectIssueNodeIds();

    for (const issue of existingIssues.values()) {
      if (issue.state === 'open' && !projectNodeIds.has(issue.nodeId)) {
        issue.boardAssignmentFailed = true;
      }
    }
  } catch (e) {
    console.warn(`  Warning: could not fetch project board members — board retry check skipped: ${ e.message }`);
  }
  console.log('');

  let created = 0; let reopened = 0; let skipped = 0; let errors = 0;
  const issueUrls = [];
  const boardAssignmentFailures = [];

  for (const failure of grouped.values()) {
    try {
      const issueTitle = githubClient._issueTitle(failure);
      const existing = existingIssues.get(issueTitle);

      if (existing?.state === 'open') {
        // Retry board assignment if the issue is open but was never successfully added to the board.
        // This handles the case where creation or reopen succeeded but addToProject failed previously.
        if (existing.boardAssignmentFailed) {
          try {
            await githubClient.addToProject(existing.nodeId);
            console.log(`  RETRY board add #${ existing.id }: ${ failure.testTitle }`);
          } catch (e) {
            console.error(`  Warning: retry board add failed for #${ existing.id }: ${ e.message }`);
            boardAssignmentFailures.push({ id: existing.id, url: existing.url });
          }
        } else {
          console.log(`  SKIP  #${ existing.id } already open: ${ failure.testTitle }`);
        }
        skipped++;
        continue;
      }
      if (existing?.state === 'closed') {
        // Test was fixed but is failing again — reopen and move back to Backlog.
        // Always call addToProject on reopen: addProjectV2ItemById is idempotent so it's safe
        // even if the issue is already on the board, and it ensures the status resets to Backlog.
        const aiSuggestions = await aiClient.generateFixSuggestions(failure);

        await githubClient.reopenIssue(existing.id, failure.environments, failure, aiSuggestions);
        try {
          await githubClient.addToProject(existing.nodeId);
        } catch (e) {
          console.error(`  Warning: could not add #${ existing.id } to project: ${ e.message }`);
          boardAssignmentFailures.push({ id: existing.id, url: existing.url });
        }
        console.log(`  REOPEN #${ existing.id }: ${ failure.testTitle }`);
        issueUrls.push(existing.url);
        reopened++;
        continue;
      }

      // No existing issue in the labelled set — do a label-independent check before
      // creating, so an issue whose labels were changed by a triager isn't duplicated.
      const untracked = await githubClient.findIssueByTitle(issueTitle);

      if (untracked) {
        // Deliberately not reopened: the issue no longer carries our labels, so it has been
        // re-categorised by a human and is outside this tool's scope to manage.
        console.log(`  SKIP  #${ untracked.id } exists as "${ untracked.state }" without our labels: ${ failure.testTitle }`);
        existingIssues.set(issueTitle, { ...untracked });
        skipped++;
        continue;
      }

      // No existing issue — create a new one and add it to the project board
      const aiSuggestions = await aiClient.generateFixSuggestions(failure);
      const task = await githubClient.createFailureTask(failure, failure.environments, aiSuggestions);

      // Register the new issue immediately so any later duplicate title in this run won't re-create it
      existingIssues.set(issueTitle, {
        id:     task.id,
        nodeId: task.nodeId,
        url:    task.url,
        state:  'open'
      });

      try {
        // Add to UI Automation project board under Backlog status
        await githubClient.addToProject(task.nodeId);
      } catch (e) {
        console.error(`  Warning: could not add #${ task.id } to project: ${ e.message }`);
        boardAssignmentFailures.push({ id: task.id, url: task.url });
      }
      console.log(`  CREATE #${ task.id }: ${ failure.testTitle }`);
      issueUrls.push(task.url);
      created++;
    } catch (err) {
      console.error(`  ERROR processing "${ failure.testTitle }": ${ err.message }`);
      errors++;
    }
  }

  return {
    totalUnique: grouped.size, created, reopened, skipped, errors, issueUrls, boardAssignmentFailures
  };
}

/**
 * Split the failures into those already tracked by an open issue, those whose issue was
 * closed (a regression that would be reopened), and those with no issue at all.
 *
 * Keyed on the same generated title the create/reopen path uses, so the counts match what
 * that path would do. Only issues carrying this tool's labels are considered, so a failure
 * whose issue was relabelled by a triager is reported as new — the label-independent
 * lookup is a per-failure search call, too expensive to run across a whole batch.
 */
function summarizeTracking(grouped, existingIssues) {
  let knownCount = 0; let regressionCount = 0; let newCount = 0;

  for (const failure of grouped.values()) {
    const existing = existingIssues.get(githubClient._issueTitle(failure));

    if (existing?.state === 'open') knownCount++;
    else if (existing?.state === 'closed') regressionCount++;
    else newCount++;
  }

  return {
    knownCount,
    regressionCount,
    newCount
  };
}

async function main() {
  const dryRun = process.env.DRY_RUN === 'true';

  console.log('=== CI Failure Inspector ===');
  console.log(`Target: ${ process.env.GITHUB_ORG || 'rancher' }/${ process.env.GITHUB_REPO || 'qa-tasks' }`);
  if (dryRun) console.log('*** DRY RUN — no issues will be created ***');
  console.log('');

  console.log('Step 1: Finding today\'s build batch...');
  const {
    anchorNumber, batch, allBuilds, inProgressBuilds, failures
  } = await jenkinsClient.collectTodayFailures();

  console.log(`  Anchor build: #${ anchorNumber }`);
  console.log(`  Builds in batch (${ allBuilds.length }):`);
  allBuilds.forEach((b) => console.log(`    #${ b.number }: ${ b.description }`));
  if (inProgressBuilds.length > 0) {
    console.log(`  Warning: ${ inProgressBuilds.length } build(s) still in progress (#${ inProgressBuilds.map((b) => b.number).join(', #') }) — results may be incomplete`);
  }
  console.log(`  Raw failing tests collected: ${ failures.length }`);
  console.log('');

  if (batch.length === 0) {
    if (inProgressBuilds.length > 0) {
      console.log(`No completed builds in today's batch — ${ inProgressBuilds.length } build(s) still in progress. Jenkins may be mid-flight.`);
      process.exit(2);
    }
    console.log('No completed builds found in today\'s batch. Exiting.');
    process.exit(2);
  }

  if (failures.length === 0) {
    console.log('No failures found. Exiting.');
    process.exit(0);
  }

  // If unique failure count exceeds threshold, alert Slack and skip issue creation.
  // This prevents flooding the project board when an env/config issue causes mass failures.
  // Slack notification is enabled by default — set INSPECTOR_SLACK_NOTIFICATION=false to disable.
  const slackThreshold = parseInt(process.env.INSPECTOR_SLACK_THRESHOLD || '10', 10);
  const slackEnabled = (process.env.INSPECTOR_SLACK_NOTIFICATION || 'true').toLowerCase() !== 'false';
  const grouped = groupFailures(failures);
  const overThreshold = grouped.size > slackThreshold;

  // Existing issues drive both the create/reopen path and the known-vs-new breakdown in
  // the high-failure alert, so fetch once here and share the result. The alert path used
  // to skip this fetch entirely, which is why the breakdown needs it hoisted above the
  // threshold check rather than left inside groupAndCreateIssues().
  let existingIssues = null;

  if (overThreshold || !dryRun) {
    console.log('  Fetching existing issues from GitHub...');
    try {
      existingIssues = await githubClient.fetchExistingIssues();
      console.log(`  Found ${ existingIssues.size } existing tracked issues`);
    } catch (e) {
      // Below the threshold this is load-bearing: without it issues get duplicated, so
      // fail loudly. On the alert path it only enriches the message, and an alert with no
      // breakdown is far better than no alert at all.
      if (!overThreshold) throw e;
      console.warn(`  Warning: could not fetch existing issues — alert will omit the known/new breakdown: ${ e.message }`);
    }
  }

  if (overThreshold) {
    console.log(`\nHigh failure count: ${ grouped.size } unique failures exceeds threshold of ${ slackThreshold }.`);
    console.log('Sending Slack alert and skipping issue creation.');

    const breakdown = existingIssues ? summarizeTracking(grouped, existingIssues) : null;

    if (breakdown) {
      console.log(`  Known (open issue)   : ${ breakdown.knownCount }`);
      console.log(`  Regressions (closed) : ${ breakdown.regressionCount }`);
      console.log(`  Potentially new      : ${ breakdown.newCount }`);
    }

    if (!dryRun && slackEnabled) {
      const sent = await sendHighFailureAlert({
        totalUnique:   grouped.size,
        batch,
        jenkinsJobUrl: `${ process.env.JENKINS_BASE_URL }/${ (process.env.JENKINS_JOB_PATH || '').split('/').map((p) => `job/${ p }`).join('/') }`,
        ...(breakdown || {}),
      });

      if (sent) {
        console.log('Slack alert sent successfully.');
      }
    } else if (dryRun) {
      console.log('*** DRY RUN — Slack alert would be sent here ***');
    } else {
      console.log('Slack notifications disabled (INSPECTOR_SLACK_NOTIFICATION=false) — skipping alert.');
    }

    process.exit(0);
  }

  if (dryRun) {
    console.log(`=== Dry Run Summary (${ grouped.size } unique failing tests) ===`);
    for (const [title, f] of grouped) {
      const envs = f.environments.map((e) => `${ e.version }·${ e.user }`).join(', ');

      console.log(`  [${ f.suite }] ${ title }`);
      if (envs) console.log(`    Environments: ${ envs }`);
    }
    process.exit(0);
  }

  console.log('Step 2: Creating/updating GitHub issues...');
  const result = await groupAndCreateIssues(failures, existingIssues);

  console.log('');

  console.log('=== Summary ===');
  console.log(`  Unique failing tests : ${ result.totalUnique }`);
  console.log(`  Issues created       : ${ result.created }`);
  console.log(`  Issues reopened      : ${ result.reopened }`);
  console.log(`  Issues skipped       : ${ result.skipped }`);
  if (result.errors) console.log(`  Errors               : ${ result.errors }`);
  if (result.issueUrls.length) {
    console.log('\nIssues:');
    result.issueUrls.forEach((u) => console.log(`  ${ u }`));
  }

  if (result.boardAssignmentFailures.length > 0) {
    console.error(`\n${ result.boardAssignmentFailures.length } issue(s) failed board assignment — please add them to the project manually:`);
    result.boardAssignmentFailures.forEach((issue) => console.error(`  #${ issue.id }: ${ issue.url }`));
  }

  if (result.errors > 0 || result.boardAssignmentFailures.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
