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

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const JENKINS_AUTH = process.env.JENKINS_AUTH;
const JENKINS_URL = process.env.JENKINS_BASE_URL;

if (!GITHUB_TOKEN) {
  console.error('ERROR: GITHUB_TOKEN env var is required');
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
const githubClient = new GitHubClient(GITHUB_TOKEN);

function groupFailures(failures) {
  // Group by testTitle so the same test failing across multiple environments
  // results in a single issue with all environments listed
  const grouped = new Map();

  for (const f of failures) {
    if (!grouped.has(f.testTitle)) grouped.set(f.testTitle, { ...f, environments: [] });
    if (f.environment) grouped.get(f.testTitle).environments.push(f.environment);
  }

  return grouped;
}

async function groupAndCreateIssues(failures) {
  const grouped = groupFailures(failures);

  // Fetch all existing issues once upfront — avoids per-failure GitHub Search API calls
  console.log('  Fetching existing issues from GitHub...');
  const existingIssues = await githubClient.fetchExistingIssues();

  console.log(`  Found ${ existingIssues.size } existing tracked issues`);
  console.log('');

  let created = 0; let reopened = 0; let skipped = 0; let errors = 0;
  const issueUrls = [];

  for (const failure of grouped.values()) {
    try {
      const issueTitle = githubClient._issueTitle(failure);
      const existing = existingIssues.get(issueTitle);

      if (existing?.state === 'open') {
        console.log(`  SKIP  #${ existing.id } already open: ${ failure.testTitle }`);
        skipped++;
        continue;
      }

      if (existing?.state === 'closed') {
        // Test was fixed but is failing again — reopen and move back to Backlog
        await githubClient.reopenIssue(existing.id, failure.environments);
        await githubClient.addToProject(existing.nodeId);
        console.log(`  REOPEN #${ existing.id }: ${ failure.testTitle }`);
        issueUrls.push(existing.url);
        reopened++;
        continue;
      }

      // No existing issue — create a new one and add it to the project board
      const task = await githubClient.createFailureTask(failure, failure.environments);

      try {
        // Add to UI Automation project board under Backlog status
        await githubClient.addToProject(task.nodeId);
      } catch (e) {
        console.error(`  Warning: could not add #${ task.id } to project: ${ e.message }`);
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
    totalUnique: grouped.size, created, reopened, skipped, errors, issueUrls
  };
}

async function main() {
  const dryRun = process.env.DRY_RUN === 'true';

  console.log('=== CI Failure Inspector ===');
  console.log(`Target: ${ process.env.GITHUB_ORG || 'rancher' }/${ process.env.GITHUB_REPO || 'qa-tasks' }`);
  if (dryRun) console.log('*** DRY RUN — no issues will be created ***');
  console.log('');

  console.log('Step 1: Finding today\'s build batch...');
  const { anchorNumber, batch, failures } = await jenkinsClient.collectTodayFailures();

  console.log(`  Anchor build: #${ anchorNumber }`);
  console.log(`  Builds in batch (${ batch.length }):`);
  batch.forEach((b) => console.log(`    #${ b.number }: ${ b.description }`));
  console.log(`  Raw failing tests collected: ${ failures.length }`);
  console.log('');

  if (failures.length === 0) {
    console.log('No failures found. Exiting.');
    process.exit(0);
  }

  if (dryRun) {
    const grouped = groupFailures(failures);

    console.log(`=== Dry Run Summary (${ grouped.size } unique failing tests) ===`);
    for (const [title, f] of grouped) {
      const envs = f.environments.map((e) => `${ e.version }·${ e.user }`).join(', ');

      console.log(`  [${ f.suite }] ${ title }`);
      if (envs) console.log(`    Environments: ${ envs }`);
    }
    process.exit(0);
  }

  console.log('Step 2: Creating/updating GitHub issues...');
  const result = await groupAndCreateIssues(failures);

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

  if (result.errors > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
