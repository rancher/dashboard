#!/usr/bin/env node

const request = require('./request');

const QA_DEV_AUTOMATION_LABEL = 'QA/dev-automation';
const QA_MANUAL_TEST_LABEL = 'QA/manual-test';
const QA_NONE_LABEL = 'QA/None';

// The event object
const event = require(process.env.GITHUB_EVENT_PATH);

async function processOpenAction() {
  const issue = event.issue;

  console.log('======');
  console.log('Processing Opened Issue #' + issue.number + ' : ' + issue.title);
  console.log('======');

  // Get an array of labels
  const labels = issue.labels.map((label) => label.name);

  // Check we have a QA label
  if (!labels.includes(QA_DEV_AUTOMATION_LABEL)  && !labels.includes(QA_MANUAL_TEST_LABEL) && !labels.includes(QA_NONE_LABEL)) {
    // Need to add the Dev Automation label

    labels.push(QA_DEV_AUTOMATION_LABEL);

    console.log('    Issue does not a QA label, adding ...');

    // Update the labels
    const labelsAPI = `${issue.url}/labels`;
    await request.put(labelsAPI, { labels });

    console.log('    Issue has been updated with QA label');
  } else {
    console.log('    Issue already has a QA label, nothing to do');
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
