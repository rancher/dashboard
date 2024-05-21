#!/usr/bin/env node

/**
 * PR workflow to move issues to the appropriate lanes on the Github project board
 */

const request = require('./request');

const TECH_DEBT_LABEL = 'kind/tech-debt';
const DEV_VALIDATE_LABEL = 'status/dev-validate';
const QA_NONE_LABEL = 'QA/None';
const QA_DEV_AUTOMATION_LABEL = 'QA/dev-automation'

const GH_PRJ_TO_TEST = 'To Test';
const GH_PRJ_QA_REVIEW = 'QA Review';
const GH_PRJ_IN_REVIEW = 'Review';

function parseOrgAndRepo(repoUrl) {
  const parts = repoUrl.split('/');

  return {
    org: parts[parts.length - 2],
    repo: parts[parts.length - 1]
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
      const vNumber = parseInt(v[2], 10);

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

async function moveIssueToProjectState(project, prjIssueID, issue, state) {
  // console.log(`moveIssueToProjectState ${ state }`);
  // console.log(JSON.stringify(project, null, 2));
  // console.log(prjIssueID);
  // console.log(JSON.stringify(issue, null, 2));
  const res = await request.ghUpdateProjectIssueStatus(project, prjIssueID, state);

  // console.log(JSON.stringify(res, null, 2));
  return res;
}

/**
 * Remove all Zube labels from an issue
 */
async function removeZubeLabels(issue) {
  const currentLabels = issue.labels.map((v) => v.name);
  let cleanLabels = issue.labels.filter(l => l.name.indexOf('[zube]') === -1);

  cleanLabels = cleanLabels.map((v) => v.name);

  // Turn the array of labels into just their names
  console.log('  Removing Zube labels:');
  console.log(`    Current Labels: ${currentLabels}`);
  console.log(`    New Labels    : ${cleanLabels}`);

  // Update the labels
  const labelsAPI = `${issue.url}/labels`;
  return request.put(labelsAPI, { labels: cleanLabels });
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
      // Re-open the issue after GH closes it
      await new Promise(r => setTimeout(r, 2500));

      // Re-open the issue if it is closed (it should be)
      if (iss.state === 'closed') {
        console.log('  Re-opening issue');
        await request.patch(detail, { state: 'open' });
      } else {
        console.log('  Expecting issue to be closed, but it is not');
      }

      // Need to fetch the issue project status
      const info = parseOrgAndRepo(iss.repository_url);
      let prjIssue = await request.ghProjectIssue(info.org, info.repo, i);

      // Is the issue on the board?
      if (!prjIssue?.[ghProject.id]) {
        // Issue is not on the board
        console.log(`Issue ${ i } is NOT on the project board - adding it ...`);

        await request.ghAddIssueToProject(ghProject, iss);

        prjIssue = await request.ghProjectIssue(info.org, info.repo, i);

        if (!prjIssue?.[ghProject.id]) {
          console.log("Error: Could not add issue to Project Board");
          console.log(prjIssue);
        } else {
          console.log('Added issue to the project board');
          console.log(JSON.stringify(prjIssue, null, 2));  
        }
      }

      if (prjIssue?.[ghProject.id]) {
        // Move to QA Review if the issue has the label that dev wrote automated tests
        if (hasLabel(iss, QA_DEV_AUTOMATION_LABEL)) {
          console.log('  Updating GitHub Project to move issue to QA Review');

          await moveIssueToProjectState(ghProject, prjIssue[ghProject.id], iss, GH_PRJ_QA_REVIEW);
          await removeZubeLabels(iss);        
        } else {
          console.log('  Updating GitHub Project to move issue to Test');

          await moveIssueToProjectState(ghProject, prjIssue[ghProject.id], iss, GH_PRJ_TO_TEST);
          await removeZubeLabels(iss);        
        }
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
      console.log('    Issue will not be moved to Review (Draft PR)');
      // TODO:
    // } else if (hasLabel(iss, BACKEND_BLOCKED_LABEL)) {
    //   console.log('    Issue will not be moved to Review (Backend Blocked)');
    } else {
      // Need to fetch the issue project status
      const info = parseOrgAndRepo(iss.repository_url);
      let prjIssue = await request.ghProjectIssue(info.org, info.repo, i);

      // Is the issue on the board?
      if (!prjIssue?.[ghProject.id]) {
        // Issue is not on the board
        console.log(`Issue ${ i } is NOT on the project board - adding it ...`);

        await request.ghAddIssueToProject(ghProject, iss);

        prjIssue = await request.ghProjectIssue(info.org, info.repo, i);

        if (!prjIssue?.[ghProject.id]) {
          console.log("Error: Could not add issue to Project Board");
          console.log(prjIssue);
        } else {
          console.log('Added issue to the project board');
          console.log(JSON.stringify(prjIssue, null, 2));  
        }
      }

      if (prjIssue?.[ghProject.id]) {
        await moveIssueToProjectState(ghProject, prjIssue[ghProject.id], iss, GH_PRJ_IN_REVIEW);
        await removeZubeLabels(iss);        
      } else {
        console.log(`Can not move issue to state ${ GH_PRJ_IN_REVIEW } - issue is not on the board`);
      }
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
// console.log(JSON.stringify(event, null, 2));

// Look at the action
if (event.action === 'opened' || event.action === 'reopened') {
  processOpenAction();
  processOpenOrEditAction();
} else if (event.action === 'edited') {
  processOpenOrEditAction();
} else if (event.action === 'closed') {
  processClosedAction();
}
