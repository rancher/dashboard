#!/usr/bin/env node

/**
 * PR workflow to move issues to the appropriate lanes on the Github project board
 */

const request = require('./request');

const TRIAGE_LABEL = '[zube]: To Triage';
const IN_REVIEW_LABEL = '[zube]: Review';
const IN_TEST_LABEL = '[zube]: To Test';
const DONE_LABEL = '[zube]: Done';
const BACKEND_BLOCKED_LABEL = '[zube]: Backend Blocked';
const QA_REVIEW_LABEL = '[zube]: QA Review';
const TECH_DEBT_LABEL = 'kind/tech-debt';
const DEV_VALIDATE_LABEL = 'status/dev-validate';
const QA_NONE_LABEL = 'QA/None';
const QA_DEV_AUTOMATION_LABEL = 'QA/dev-automation'

const GH_PRJ_TRIAGE = 'Triage';

const GH_PRJ_TO_TEST = 'To Test';
const GH_PRJ_QA_REVIEW = 'QA Review';
const GH_PRJ_IN_REVIEW = 'In Review';

function parseOrgAndRepo(repoUrl) {
  const parts = repoUrl.split('/');

  return {
    org: parts[parts.length - 1],
    repo: parts[parts.length - 2]
  };
}

// Check required environment variables
if (!process.env.GH_TOKEN) {
  console.log('You must set a GitHub token in the GH_TOKEN environment variable');

  return;
}

if (!process.env.PR_PROJECT) {
  console.log('You must set the GitHub project in the PR_PROJECT environment variable (format org#number)');

  return;
}

// Check the format
const ghProjectId = process.env.PR_PROJECT.split('#');

if (ghProjectId.length !== 2) {
  console.log('Error: PR_PROJECT is not in the correct format (format org#number)');

  return;
}

// The event object
const event = require(process.env.GITHUB_EVENT_PATH);

function getReferencedIssues(body) {
  // https://docs.github.com/en/github/managing-your-work-on-github/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
  const regexp = /[Ff]ix(es|ed)?\s*#([0-9]*)|[Cc]lose(s|d)?\s*#([0-9]*)|[Rr]esolve(s|d)?\s*#([0-9]*)/g;
  var v;
  const issues = [];
  do {
    v = regexp.exec(body);
    if (v) {
      issues.push(parseInt(v[2], 10));
    }
  } while (v);
  return issues;
}

function hasLabel(issue, label) {
  const labels = issue.labels || [];

  return !!(labels.find(l => l.name.toLowerCase() === label.toLowerCase()));
}

function moveIssueToProjectState(issue, state) {
  console.log(`moveIssueToProjectState ${ state }`);

  console.log(JSON.stringify(issue, null, 2));
}

/**
 * Remove Zube labels
 */
async function removeZubeLabels(issue, label) {
  // Remove all Zube labels
  let cleanLabels = labels.filter(l => l.name.indexOf('[zube]') === -1);

  cleanLabels = cleanLabels.map((v) => {
    return v.name;
  });

  // Turn the array of labels into just their names
  console.log(`    Current Labels: ${cleanLabels}`);

  // Add the 'to test' label
  cleanLabels.push(label);
  console.log(`    New Labels    : ${cleanLabels}`);

  // Update the labels
  const labelsAPI = `${issue.url}/labels`;
  return request.put(labelsAPI, { labels: cleanLabels });
}

async function waitForLabel(issue, label) {
  let tries = 0;
  while (!hasLabel(issue, label) && tries < 10) {
    console.log(`  Waiting for issue to have the label ${label} (${tries})`);

    // Wait 10 seconds
    await new Promise(r => setTimeout(r, 10000));

    // Refetch the issue
    issue = await request.fetch(issue.url);

    tries++;
  }

  if (tries > 10) {
    console.log('WARNING: Timed out waiting for issue to have the Done label');
  } else {
    console.log('  Issue has the done label');
  }
}

async function processClosedAction() {
  const pr = event.pull_request;
  const body = pr.body;

  // Get the Github project data
  const ghProject = await request.ghProject(ghProjectId[0], ghProjectId[1]);

  if (!ghProject || ghProject.errors) {
    console.log('Error: Can not fetch GitHub Project metadata');
  
    return; 
  }
  
  console.log(JSON.stringify(ghProject, null, 2));

  console.log('======');
  console.log('Processing Closed PR #' + pr.number + ' : ' + pr.title);
  console.log('======');

  // Check that the issue was merged and not just closed
  if (!pr.merged) {
    console.log('  PR was closed without merging - ignoring');
    return;
  }

  const issues = getReferencedIssues(body);
  if (issues.length > 0) {
    console.log('  This PR fixes issues: ' + issues.join(', '));
  } else {
    console.log("  This PR does not fix any issues");
    return;
  }

  // Need to get all open PRs to see if any other references the same issues that this PR says it fixes
  const openPRs = event.repository.url + '/pulls?state=open&per_page=100';
  const r = await request.fetch(openPRs);
  const issueMap = issues.reduce((prev, issue) => { prev[issue] = true; return prev; }, {})

  // Go through all of the Open PRs and see if they fix any of the same issues that this PR does
  // If not, then the issue has been completed, so we can process it
  r.forEach(openPR => {
    const fixed = getReferencedIssues(openPR.body);
    fixed.forEach(issue => issueMap[issue] = false);
  });

  // Filter down the list of issues that should be closed because this PR was merged
  const fixed = Object.keys(issueMap).filter(key => !!issueMap[key]);
  console.log('');

  Object.keys(issueMap).forEach(k => {
    if (k && !issueMap[k]) {
      console.log(`  Issue #${k} will be ignored as another open PR also states that it fixes this issue`);
    }
  });

  // GitHub will do the closing, so we expect each issue to already be closed
  // We will fetch each issue in turn, expecting it to be closed
  // We will re-open the issue and label it as ready to test
  fixed.forEach(async (i) => {
    const detail = event.repository.url + '/issues/' + i;
    const iss = await request.fetch(detail);
    console.log('')
    console.log('Processing Issue #' + i + ' - ' + iss.title);

    // If the issue is a tech debt issue or says dev will validate then don't move it to 'To Test'
    if (hasLabel(iss, TECH_DEBT_LABEL) || hasLabel(iss, DEV_VALIDATE_LABEL) || hasLabel(iss, QA_NONE_LABEL)) {
      console.log('  Issue is tech debt/dev validate/qa none - ignoring');
    } else {
      // Put this in when we remove the Zube workflow
      // A single workflow needs to re-open the issue after GH closes it
      // console.log('  Waiting for Zube to mark the issue as done ...');

      // // Output labels
      // const labels = iss.labels || [];

      // console.log(labels.join(', '));

      // // console.log(JSON.stringify(iss, null, 2));

      // // The Zube Integration will label the issue with the Done label
      // // Since it runs via a webhook, it should have done that well before our GitHub action
      // // is scheduled and has run, but we will check it has the label and wait if not
      // await waitForLabel(iss, DONE_LABEL);

      // // Wait
      // await new Promise(r => setTimeout(r, 10000));
      // // Re-open the issue if it is closed
      // if (iss.state === 'closed') {
      //   console.log('  Re-opening issue');
      //   await request.patch(detail, { state: 'open' });
      // } else {
      //   console.log('  Expecting issue to be closed, but it is not');
      // }

      // console.log('  Waiting for Zube to mark the issue as in triage ...');

      // // The Zube Integration will label the issue as To Triage now that is has been re-opened
      // // Wait for that and then we can move it to test
      // await waitForLabel(iss, TRIAGE_LABEL);

      // Move to QA Review if the issue has the label that dev wrote automated tests
      if (hasLabel(iss, QA_DEV_AUTOMATION_LABEL)) {
        console.log('  Updating GitHub Project to move issue to QA Review');

        console.log(JSON.stringify(iss, null, 2));

        // await moveIssueToProjectState(iss, GH_PRJ_QA_REVIEW);
        // Uncomment when we switch off Zube 
        // await removeZubeLabels(iss);
      } else {
        console.log('  Updating GitHub Project to move issue to Test');

        console.log(JSON.stringify(iss, null, 2));

        // await moveIssueToProjectState(iss, GH_PRJ_TO_TEST);
        // Uncomment when we switch off Zube 
        // await removeZubeLabels(iss);
      }
    }

    console.log('');
  });
}

async function processOpenAction() {
  const pr = event.pull_request;

  // Check that an assignee has been set
  if (pr.assignees.length === 0) {
    console.log('======');
    console.log('Processing Opened PR #' + pr.number + ' : ' + pr.title);
    console.log('======');

    console.log(`  Adding assignee to the PR: ${pr.user.login}`);

    // Update the assignees
    const assigneesAPI = `${event.repository.url}/issues/${pr.number}/assignees`;
    await request.post(assigneesAPI, { assignees: [pr.user.login] });
  }
}

async function processOpenOrEditAction() {
  console.log('======');
  console.log('Processing Opened/Edited PR #' + event.pull_request.number + ' : ' + event.pull_request.title);
  console.log('======');

  // Get the Github project data
  const ghProject = await request.ghProject(ghProjectId[0], ghProjectId[1]);

  if (!ghProject || ghProject.errors) {
    console.log('Error: Can not fetch GitHub Project metadata');
  
    return; 
  }
  
  console.log(JSON.stringify(ghProject, null, 2));  

  const pr = event.pull_request;
  const body = pr.body;
  const issues = getReferencedIssues(body);
  if (issues.length > 0) {
    console.log('+ This PR fixes issues: #' + issues.join(', '));
  } else {
    console.log("+ This PR does not fix any issues");
  }

  const milestones = {};

  for (i of issues) {
    const detail = `${event.repository.url}/issues/${i}`;
    const iss = await request.fetch(detail);
    console.log('')
    console.log('Processing Issue #' + i + ' - ' + iss.title);

    if (pr.draft) {
      console.log('    Issue will not be moved to In Review (Draft PR)');
    } else if (hasLabel(iss, BACKEND_BLOCKED_LABEL)) {
      console.log('    Issue will not be moved to In Review (Backend Blocked)');
    } else {
      // Need to fetch the issue project status
      const info = parseOrgAndRepo(iss.repository_url);
      const prjIssue = request.ghProjectIssue(info.org, info.repo, i.number);

      console.log(info);

      console.log('-------- GH ISSUE -----');
      console.log(JSON.stringify(prjIssue, null, 2));  
      console.log('---------');

      await moveIssueToProjectState(iss, GH_PRJ_IN_REVIEW);
    }

    if (iss.milestone) {
      milestones[iss.milestone.title] = iss.milestone.number;
    }
  }

  const keys = Object.keys(milestones);
  if (keys.length === 0) {
    console.log('No milestones on issue(s) for this PR');
  } else if (keys.length > 1) {
    console.log('More than one milestone on issues for this PR');
  } else {
    // There is exactly 1 milestone, so use that for the PR
    const milestoneNumber = milestones[keys[0]];

    if (event.pull_request.milestone?.number !== milestoneNumber) {
      console.log('Updating PR with milestone: ' + keys[0]);
      await request.patch(event.pull_request.issue_url, { milestone: milestoneNumber });
    } else {
      console.log('PR is already assigned to milestone ' + keys[0]);
    }
  }
}

// Debugging
console.log(JSON.stringify(event, null, 2));

// Look at the action
if (event.action === 'opened' || event.action === 'reopened') {
  processOpenAction();
  processOpenOrEditAction();
} else if (event.action === 'edited') {
  processOpenOrEditAction();
} else if (event.action === 'closed') {
  processClosedAction();
}
