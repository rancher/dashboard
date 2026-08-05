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

import { fetchWithRetry } from './fetch-utils.js';

const JENKINS_BASE = process.env.JENKINS_BASE_URL || 'https://your-jenkins-instance';
const JOB_PATH = process.env.JENKINS_JOB_PATH || 'rancher_qa/ui-automation-ansible-job';
const ANCHOR_DESCRIPTION = process.env.INSPECTOR_ANCHOR_DESCRIPTION || 'head · community · @adminUser';
const ANCHOR_MAX_AGE_MS = 36 * 60 * 60 * 1000; // 36 hours
const VERSION_FILTER = process.env.INSPECTOR_VERSION_FILTER || null; // e.g. "head" to only process head builds

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
      const res = await fetchWithRetry(url, { headers: { Authorization: `Basic ${ this.auth }` } });

      if (!res.ok) {
        const err = new Error(`Jenkins HTTP ${ res.status }: ${ url }`);

        err.status = res.status;
        throw err;
      }

      return res.json();
    } catch (e) {
      if (e.cause) throw new Error(`Jenkins unreachable at ${ url } (${ e.cause.message })`);
      throw e;
    }
  }

  async getBatch() {
    // Fetch recent builds and find the most recent anchor build.
    // Window size is configurable via INSPECTOR_BUILD_WINDOW (default: 50).
    // All builds from the anchor to the latest (excluding in-progress) form today's batch.
    const window = parseInt(process.env.INSPECTOR_BUILD_WINDOW || '50', 10);
    const data = await this._get(
      `${ this.jobUrl }/api/json?tree=builds[number,description,result,timestamp]{0,${ window }}`
    );

    const builds = data.builds;
    const anchorIdx = builds.findIndex((b) => b.description === ANCHOR_DESCRIPTION);

    if (anchorIdx === -1) {
      throw new Error(
        `Could not find batch anchor ("${ ANCHOR_DESCRIPTION }") in the last ${ window } builds. ` +
        `If the job runs frequently, increase INSPECTOR_BUILD_WINDOW. ` +
        `If the description format changed, update INSPECTOR_ANCHOR_DESCRIPTION.`
      );
    }

    const anchor = builds[anchorIdx];
    const anchorAgeMs = Date.now() - anchor.timestamp;

    if (anchorAgeMs > ANCHOR_MAX_AGE_MS) {
      const hours = Math.round(anchorAgeMs / (60 * 60 * 1000));

      console.warn(
        `Warning: most recent anchor build #${ anchor.number } is ${ hours }h old — ` +
        `Jenkins may have had an outage. Results may be stale.`
      );
    }

    const anchorNumber = anchor.number;
    const allBuilds = builds.slice(0, anchorIdx + 1);
    const inProgressBuilds = allBuilds.filter((b) => b.result === null);
    const completedBuilds = allBuilds.filter((b) => b.result !== null);
    const infraFailedBuilds = completedBuilds.filter((b) => b.result === 'ABORTED' || b.result === 'FAILURE');
    const batch = completedBuilds;

    if (infraFailedBuilds.length > 0) {
      console.warn(
        `Warning: ${ infraFailedBuilds.length } build(s) in today's batch ended with ABORTED/FAILURE ` +
        `(#${ infraFailedBuilds.map((b) => b.number).join(', #') }) — ` +
        `these may not have produced test reports. Infrastructure failures will not be reflected as test issues.`
      );
    }

    return {
      anchorNumber, batch, infraFailedBuilds, inProgressBuilds
    };
  }

  async getFailingTests(build) {
    // Fetch structured JUnit test results for a build.
    // Returns only FAILED or REGRESSION cases — skips passed/skipped tests.
    // Returns empty array if no test report exists (build may have had no tests).
    // Warns if a build-level failure (ABORTED/FAILURE) has no test report — likely infra issue.
    let data;

    try {
      data = await this._get(
        `${ this.jobUrl }/${ build.number }/testReport/api/json?tree=suites[cases[name,className,status,errorDetails,errorStackTrace]]`
      );
    } catch (e) {
      if (e.status === 404) {
        if (build.result === 'FAILURE' || build.result === 'ABORTED') {
          console.warn(`Build #${ build.number } ended with ${ build.result } but has no test report — likely an infrastructure failure, not a test failure.`);
        }

        return [];
      }

      console.error(`Build #${ build.number } test report returned an unexpected status: ${ e.message }`);

      return [];
    }

    return data.suites
      .flatMap((s) => s.cases)
      .filter((c) => c.status === 'FAILED' || c.status === 'REGRESSION');
  }

  async collectTodayFailures() {
    // Main entry point — finds today's batch and collects all failing tests
    // with environment context parsed from each build's description field.
    // If INSPECTOR_VERSION_FILTER is set, only builds whose description starts with
    // that value are processed (e.g. "head" skips v2.13-head, v2.14-head, v2.15-head).
    const { anchorNumber, batch, inProgressBuilds } = await this.getBatch();

    const filteredBatch = VERSION_FILTER ? batch.filter((b) => (b.description || '').startsWith(VERSION_FILTER)) : batch;

    if (VERSION_FILTER) {
      console.log(`  Version filter: "${ VERSION_FILTER }" — processing ${ filteredBatch.length } of ${ batch.length } build(s)`);
    }

    const failures = [];

    for (const build of filteredBatch) {
      const raw = await this.getFailingTests(build);
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
      anchorNumber, batch: filteredBatch, allBuilds: batch, inProgressBuilds, failures
    };
  }
}
