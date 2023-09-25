const event = require(process.env.GITHUB_EVENT_PATH);

if (event.action !== 'closed') {
  const pr = event.pull_requests[0];

  console.warn(pr);

  const fullPRUrl = `${event.repository.url}/pull/${pr.id}`;
  console.warn(fullPRUrl);

  const fullPR = await request.fetch(fullPRUrl);

  console.warn(fullPR);

  if (!fullPR.milestone) {
    core.setFailed( '❌ Pull request must have a Milestone. Assign one and toggle a label to re-run' )
  }

}
