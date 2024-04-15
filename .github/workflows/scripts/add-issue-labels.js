#!/usr/bin/env node

const request = require('./request');

const QA_DEV_AUTOMATION_LABEL = 'QA/dev-automation';
const QA_MANUAL_TEST_LABEL = 'QA/manual-test';
const QA_NONE_LABEL = 'QA/None';

const EMBER_LABEL = 'ember';
const TECH_DEBT_LABEL = 'kind/tech-debt';

const TRIAGE_LABEL = '[zube]: To Triage';

// The event object
const event = require(process.env.GITHUB_EVENT_PATH);

async function processOpenAction() {
  const issue = event.issue;

  console.log('======');
  console.log('Processing Opened Issue #' + issue.number + ' : ' + issue.title);
  console.log('======');

  // Get an array of labels
  const labels = issue.labels.map((label) => label.name);

  // Make a note if we changed the labels, either adding a QA or the Triage label
  let didUpdateLabels = false;

  // Check we have a QA label
  if (!labels.includes(QA_DEV_AUTOMATION_LABEL) && !labels.includes(QA_MANUAL_TEST_LABEL) && !labels.includes(QA_NONE_LABEL)) {

    // Add the appropriate QA label
    if (labels.includes(TECH_DEBT_LABEL)) {
      console.log('    Issue does not have a QA label, adding QA/None label (as issue is marked as tech-debt)');

      labels.push(QA_NONE_LABEL);
    } else if (labels.includes(EMBER_LABEL)) {
      console.log('    Issue does not have a QA label, adding manual test label (as issue is marked as ember)');

      labels.push(QA_MANUAL_TEST_LABEL);
    } else {
      console.log('    Issue does not have a QA label, adding dev-automation label');

      labels.push(QA_DEV_AUTOMATION_LABEL);
    }

    didUpdateLabels = true;
  }

  // Check we have a Zube label
  const hasZubeLabel = labels.filter((label) => label.indexOf('[zube]:') === 0).length > 0;

  if (!hasZubeLabel) {
    labels.push(TRIAGE_LABEL);
    didUpdateLabels = true;
  }

  // Update the labels if we made a change
  if (didUpdateLabels) {
    // Update the labels
    const labelsAPI = `${issue.url}/labels`;
    await request.put(labelsAPI, { labels });

    console.log('    Issue has been updated with new labels');
  } else {
    console.log('    Issue already has required labels, nothing to do');
  }
}

// Debugging
// console.log(JSON.stringify(event, null, 2));

// Look at the action
if (event.action === 'opened') {
  processOpenAction();
} else {
  console.log(`Unsupported action: ${event.action}`);
}
