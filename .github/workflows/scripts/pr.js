#!/usr/bin/env node

const request = require('./request');

const TRIAGE_LABEL = '[zube]: To Triage';
const IN_REVIEW_LABEL = '[zube]: Review';
const IN_TEST_LABEL = '[zube]: To Test';
const DONE_LABEL = '[zube]: Done';
const BACKEND_BLOCKED_LABEL = '[zube]: Backend Blocked';
const TECH_DEBT_LABEL = 'kind/tech-debt';
const DEV_VALIDATE_LABEL = 'status/dev-validate';

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

    return !!(labels.find(l =>l.name.toLowerCase() === label.toLowerCase()));
}

function removeZubeLabels(labels) {
    return labels.filter(l => l.name.indexOf('[zube]') === -1);
}

async function resetZubeLabels(issue, label) {
    // Remove all Zube labels
    let cleanLabels = removeZubeLabels(issue.labels);

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
    return request.put(labelsAPI, {labels: cleanLabels});
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

    console.log('======');
    console.log('Processing Closed PR #' + pr.number + ' : ' + pr.title);
    console.log('======');

    // Check that the issue was merged and not just closed
    if (!pr.merged) {
        console.log( '  PR was closed without merging - ignoring');
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
    fixed.forEach(async(i) => {
        const detail = event.repository.url + '/issues/' + i;
        const iss = await request.fetch(detail);
        console.log('')
        console.log('Processing Issue #' + i + ' - ' + iss.title);

        // If the issue is a tech debt issue or says dev will validate then don't move it to 'To Test'
        if(hasLabel(iss, TECH_DEBT_LABEL) || hasLabel(iss, DEV_VALIDATE_LABEL)) {
            console.log('  Issue is tech debt/dev validate - ignoring');
        } else {
            console.log('  Updating labels to move issue to Test');

            // Output labels
            const labels = iss.labels || [];

            console.log(labels.join(', '));

            // console.log(JSON.stringify(iss, null, 2));

            // The Zube Integration will label the issue with the Done label
            // Since it runs via a webhook, it should have done that well before our GitHub action
            // is scheduled and has run, but we will check it has the label and wait if not
            await waitForLabel(iss, DONE_LABEL);

            // Wait
            await new Promise(r => setTimeout(r, 10000));
            // Re-open the issue if it is closed
            if (iss.state === 'closed') {
                console.log('  Re-opening issue');
                await request.patch(detail, { state: 'open' });
            } else {
                console.log('  Expecting issue to be closed, but it is not');
            }

            // The Zube Integration will label the issue as To Triage now that is has been re-opened
            // Wait for that and then we can move it to test
            await waitForLabel(iss, TRIAGE_LABEL);
            await resetZubeLabels(iss, IN_TEST_LABEL);
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
        await request.post(assigneesAPI, {assignees: [pr.user.login]});
    }
}

async function processOpenOrEditAction() {
    console.log('======');
    console.log('Processing Opened/Edited PR #' + event.pull_request.number + ' : ' + event.pull_request.title);
    console.log('======');

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
        if (!hasLabel(iss, IN_REVIEW_LABEL)) {
            // Add the In Review label to the issue as it does not have it
            await resetZubeLabels(iss, IN_REVIEW_LABEL);
        } else {
            console.log('    Issue already has the In Review label');
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
        await request.patch(event.pull_request.issue_url, {milestone: milestoneNumber});
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
