/* eslint-disable no-console */
/**
 * Jenkins REST API client for CI Failure Inspector.
 *
 * Fetches build metadata and test results directly from Jenkins —
 * suitable for unattended GHA runs.
 *
 * How batch detection works:
 *   Jenkins runs multiple builds per day across different environments.
 *   A special "anchor" build (`head · community · @adminUser`) marks the
 *   start of each daily batch. This client finds the most recent anchor
 *   and collects all builds from that point forward as "today's batch".
 */

const JENKINS_BASE = process.env.JENKINS_BASE_URL || 'https://your-jenkins-instance';
const JOB_PATH = process.env.JENKINS_JOB_PATH || 'rancher_qa/ui-automation-ansible-job';

// Converts "rancher_qa/ui-automation-ansible-job" → "/job/rancher_qa/job/ui-automation-ansible-job"
function toJobUrl(jobPath) {
  return jobPath.split('/').map((p) => `job/${ p }`).join('/');
}

export class JenkinsClient {
  constructor(authToken) {
    this.auth = authToken;
    this.jobUrl = `${ JENKINS_BASE }/${ toJobUrl(JOB_PATH) }`;
  }

  async _get(url) {
    try {
      const res = await fetch(url, { headers: { Authorization: `Basic ${ this.auth }` } });

      if (!res.ok) throw new Error(`Jenkins HTTP ${ res.status }: ${ url }`);

      return res.json();
    } catch (e) {
      if (e.cause) throw new Error(`Jenkins unreachable at ${ url } (${ e.cause.message })`);
      throw e;
    }
  }

  async getBatch() {
    // Fetch the last 30 builds and find the most recent anchor build.
    // All builds from the anchor to the latest (excluding in-progress) form today's batch.
    const data = await this._get(
      `${ this.jobUrl }/api/json?tree=builds[number,description,result,timestamp]{0,30}`
    );

    const builds = data.builds;
    const anchorIdx = builds.findIndex((b) => b.description === 'head · community · @adminUser');

    if (anchorIdx === -1) throw new Error('Could not find batch anchor (head · community · @adminUser) in the last 30 builds.');

    const anchorNumber = builds[anchorIdx].number;
    const batch = builds
      .slice(0, anchorIdx + 1)
      .filter((b) => b.result !== null);

    return { anchorNumber, batch };
  }

  async getFailingTests(buildNumber) {
    // Fetch structured JUnit test results for a build.
    // Returns only FAILED or REGRESSION cases — skips passed/skipped tests.
    // Returns empty array if no test report exists (build may have had no tests).
    let data;

    try {
      data = await this._get(
        `${ this.jobUrl }/${ buildNumber }/testReport/api/json?tree=suites[cases[name,className,status,errorDetails,errorStackTrace]]`
      );
    } catch (e) {
      if (e.message.includes('404')) return [];
      throw e;
    }

    return data.suites
      .flatMap((s) => s.cases)
      .filter((c) => c.status === 'FAILED' || c.status === 'REGRESSION');
  }

  async collectTodayFailures() {
    // Main entry point — finds today's batch and collects all failing tests
    // with environment context parsed from each build's description field.
    const { anchorNumber, batch } = await this.getBatch();

    const failures = [];

    for (const build of batch) {
      const raw = await this.getFailingTests(build.number);
      const desc = build.description || '';
      const parts = desc.split(' · ').map((p) => p.trim());
      const environment = {
        version: parts[0] || 'unknown',
        env:     parts[1] || 'unknown',
        user:    parts[2] || 'unknown',
      };

      for (const t of raw) {
        failures.push({
          testTitle:    t.name,
          suite:        t.className,
          errorSummary: t.errorDetails,
          stacktrace:   t.errorStackTrace,
          framework:    'Cypress',
          environment,
        });
      }
    }

    return {
      anchorNumber, batch, failures
    };
  }
}
