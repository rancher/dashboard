/* eslint-disable no-console */
/**
 * Slack client for CI Failure Inspector.
 * Sends alert messages to the UI QA channel when failure counts exceed the threshold.
 */

const SLACK_API = 'https://slack.com/api/chat.postMessage';

export async function sendHighFailureAlert({
  totalUnique, batch, jenkinsJobUrl, knownCount = null, regressionCount = 0, newCount = 0
}) {
  const token = process.env.UI_QA_SLACK_BOT_TOKEN;
  const channel = process.env.UI_QA_SLACK_CHANNEL;

  if (!token) {
    console.warn('Warning: UI_QA_SLACK_BOT_TOKEN not set — skipping Slack notification');

    return false;
  }
  if (!channel) {
    console.warn('Warning: UI_QA_SLACK_CHANNEL not set — skipping Slack notification');

    return false;
  }

  const buildLines = batch
    .map((b) => `• <${ jenkinsJobUrl }/${ b.number }|#${ b.number }>: ${ b.description }`)
    .join('\n');

  const groupId = process.env.UI_QA_SLACK_GROUP_ID;

  if (!groupId) {
    console.warn('Warning: UI_QA_SLACK_GROUP_ID not set — @ui-qa will not be mentioned');
  }

  const mention = groupId ? `<!subteam^${ groupId }>` : '';

  // Tells the team at a glance whether a spike is env/infra noise against already-known
  // failures, or a genuine wave of new ones. Omitted entirely when the GitHub lookup that
  // produces the counts failed, so the alert itself is never blocked by it.
  const breakdown = knownCount === null ? [] : [
    ``,
    `*Of these:*`,
    `• *${ knownCount }* already have an open issue on the project board (known failures)`,
    ...(regressionCount > 0 ? [`• *${ regressionCount }* have a closed issue and would be reopened (regressions)`] : []),
    `• *${ newCount }* are not yet tracked (potentially new)`,
  ];

  const message = [
    `${ mention }${ mention ? ' ' : '' }:alert: *High failure count detected — issue creation skipped*`,
    ``,
    `*${ totalUnique } unique test failure(s)* were found in today's Jenkins batch. This may indicate an environment or configuration issue rather than individual flaky tests.`,
    ...breakdown,
    ``,
    `*Builds in batch:*`,
    buildLines,
    ``,
    `Please review the Jenkins results and determine if these are real flaky test failures before manually creating issues.`,
    ``,
    `*Timestamp:* ${ new Date().toUTCString() }`,
  ].join('\n');

  const payload = JSON.stringify({
    channel,
    text:     message,
    username: 'CI Failure Inspector',
  });

  try {
    const res = await fetch(SLACK_API, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization:  `Bearer ${ token }`,
      },
      body: payload,
    });

    const data = await res.json();

    if (!data.ok) {
      console.error(`Slack API error: ${ data.error }`);

      return false;
    }

    return true;
  } catch (e) {
    console.error(`Failed to send Slack notification: ${ e.message }`);

    return false;
  }
}
