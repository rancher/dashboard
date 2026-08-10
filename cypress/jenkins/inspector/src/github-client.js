/* eslint-disable no-console */
/**
 * GitHub API client for CI Failure Inspector.
 * Manages issue creation, reopening, deduplication, and project board assignment.
 * Configuration is via environment variables — see README.md for the full list.
 */

import { fetchWithRetry } from './fetch-utils.js';

const GH_API = 'https://api.github.com';

// GitHub truncates issue titles beyond this length — we must truncate identically
// so a generated title always matches the title GitHub stored for the same failure.
const MAX_ISSUE_TITLE_LENGTH = 256;

class GitHubClient {
  constructor(token, projectToken) {
    this.org = process.env.GITHUB_ORG || 'rancher';
    this.repo = process.env.GITHUB_REPO || 'qa-tasks';
    this.project = parseInt(process.env.GITHUB_PROJECT_NUMBER || '40', 10);
    this.projectOwnerType = process.env.GITHUB_PROJECT_OWNER || 'org';
    this.labels = (process.env.GITHUB_ISSUE_LABELS || 'area/automation-test-ui,kind/flaky-test')
      .split(',').map((l) => l.trim()).filter(Boolean);
    this.statusFieldId = process.env.STATUS_FIELD_ID;
    this.backlogOptionId = process.env.BACKLOG_OPTION_ID;
    this.headers = {
      Authorization:  `token ${ token }`,
      Accept:         'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
    this.projectHeaders = {
      Authorization:  `token ${ projectToken }`,
      Accept:         'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  async _request(method, path, body, retryConfig) {
    const url = path.startsWith('http') ? path : `${ GH_API }${ path }`;
    const res = await fetchWithRetry(url, {
      method,
      headers: this.headers,
      body:    body ? JSON.stringify(body) : undefined
    }, retryConfig);
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || `GitHub HTTP ${ res.status }: ${ path }`);

    return data;
  }

  async _projectRequest(method, path, body) {
    const url = path.startsWith('http') ? path : `${ GH_API }${ path }`;
    const res = await fetchWithRetry(url, {
      method,
      headers: this.projectHeaders,
      body:    body ? JSON.stringify(body) : undefined
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || `GitHub HTTP ${ res.status }: ${ path }`);

    return data;
  }

  async _get(path) {
    return this._request('GET', path);
  }

  async _post(path, body) {
    return this._request('POST', path, body);
  }

  async _patch(path, body) {
    return this._request('PATCH', path, body);
  }

  _issueTitle(failure) {
    // For hook failures, extract the actual test name from inside the quotes.
    // e.g. '"after all" hook: clean up for "my test"' → 'my test'
    const hookMatch = failure.testTitle.match(/^"(?:before|after) (?:each|all)" hook[^"]*"(.+)"$/);
    const normalizedTitle = hookMatch ? hookMatch[1] : failure.testTitle;

    // Deduplication compares this generated title against the title GitHub stored.
    // GitHub collapses newlines and trims titles, and truncates them at MAX_ISSUE_TITLE_LENGTH.
    // If we don't apply the same normalization the stored title can never match what we
    // generate on the next run, which would re-create the same issue on every run forever.
    const title = `[UI][Auto] ${ this._normalize(failure.suite) } > ${ this._normalize(normalizedTitle) }`;

    return title.length > MAX_ISSUE_TITLE_LENGTH ? `${ title.slice(0, MAX_ISSUE_TITLE_LENGTH - 1) }…` : title;
  }

  _normalize(value) {
    // Collapse all whitespace runs (including newlines/tabs) to single spaces and trim
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  async fetchExistingIssues() {
    // Fetch all [UI][Auto] issues (open + closed) upfront — avoids per-failure search API calls.
    // Filters by the full label set so deduplication doesn't miss issues if labels change.
    // Returns a Map keyed by issue title for O(1) lookup during processing.
    const MAX_PAGES = 20;
    const map = new Map();
    const labelParam = encodeURIComponent(this.labels.join(','));
    let page = 1;
    let truncated = false;

    for (;;) {
      const issues = await this._get(
        `/repos/${ this.org }/${ this.repo }/issues?state=all&labels=${ labelParam }&sort=created&direction=asc&per_page=100&page=${ page }`
      );

      for (const issue of issues) {
        const previous = map.get(issue.title);

        // If duplicate titles already exist in the repo, always keep the open one.
        // Otherwise a closed duplicate could shadow an open issue and we'd reopen the
        // closed one, leaving two open issues tracking the same test.
        if (previous?.state === 'open' && issue.state !== 'open') continue;

        map.set(issue.title, {
          id:     issue.number,
          nodeId: issue.node_id,
          url:    issue.html_url,
          state:  issue.state
        });
      }

      if (issues.length < 100) break;

      if (page >= MAX_PAGES) {
        truncated = true;
        break;
      }

      page++;
    }

    // Refuse to continue on a partial list. Any issue we failed to load looks "new",
    // so proceeding would re-create issues that already exist.
    if (truncated) {
      throw new Error(
        `fetchExistingIssues: reached the ${ MAX_PAGES }-page ceiling (${ map.size }+ issues) so the ` +
        `deduplication list is incomplete. Aborting before creating duplicates. ` +
        `Close or archive stale [UI][Auto] issues, or raise MAX_PAGES.`
      );
    }

    return map;
  }

  async findIssueByTitle(title) {
    // Last-line-of-defense lookup used immediately before creating an issue.
    // fetchExistingIssues() filters on labels, so an issue that a triager relabelled
    // is invisible to it and would be re-created. Search ignores our labels entirely.
    // Returns null on failure — this is a safety net, never a hard dependency.
    try {
      const q = encodeURIComponent(`repo:${ this.org }/${ this.repo } in:title "${ title.replace(/"/g, ' ') }"`);
      const res = await this._get(`/search/issues?q=${ q }&per_page=100`);

      // Search matching is fuzzy, so compare titles exactly and prefer an open issue
      const matches = (res.items || []).filter((i) => i.title === title && !i.pull_request);
      const match = matches.find((i) => i.state === 'open') || matches[0];

      if (!match) return null;

      return {
        id:     match.number,
        nodeId: match.node_id,
        url:    match.html_url,
        state:  match.state
      };
    } catch (e) {
      console.warn(`  Warning: duplicate pre-check failed for "${ title }": ${ e.message }`);

      return null;
    }
  }

  _renderEnvironmentsTable(environments) {
    // Renders a markdown table listing each environment the test failed in
    if (!environments?.length) return '';
    const rows = environments.map((e) => {
      const user = e.user ? `\`${ e.user }\`` : '—';

      return `| ${ e.version || '—' } | ${ e.env || '—' } | ${ user } |`;
    }).join('\n');

    return `### Failing Environments\n| Version | Environment | User |\n|---------|-------------|------|\n${ rows }`;
  }

  async reopenIssue(issueNumber, environments = []) {
    await this._patch(`/repos/${ this.org }/${ this.repo }/issues/${ issueNumber }`, { state: 'open' });

    const envTable = this._renderEnvironmentsTable(environments);

    await this._post(`/repos/${ this.org }/${ this.repo }/issues/${ issueNumber }/comments`, { body: `**Regression detected** — this test is failing again.\n\n${ envTable }\n\n*Auto-detected by CI Failure Inspector.*` });
  }

  async createFailureTask(failure, environments = []) {
    const title = this._issueTitle(failure);
    const envTable = this._renderEnvironmentsTable(environments);

    const body = `## Failure Details

**Framework:** ${ failure.framework || 'Cypress' }
**Suite:** ${ failure.suite }

${ envTable ? `${ envTable }\n` : '' }
### Error Summary
\`\`\`
${ failure.errorSummary }
\`\`\`

### Stack Trace
\`\`\`
${ failure.stacktrace || 'No stack trace available' }
\`\`\`

---
*Auto-generated by [CI Failure Inspector](https://github.com/rancher/dashboard/tree/master/cypress/jenkins/inspector)*`;

    try {
      // Deliberately not retried at the HTTP layer: a timeout or connection reset can fire
      // after GitHub already accepted the create, so a blind retry duplicates the issue.
      // Resilience is provided by the recovery lookup below instead.
      const response = await this._request('POST', `/repos/${ this.org }/${ this.repo }/issues`, {
        title, body, labels: this.labels
      }, { retries: 0 });

      return {
        id:     response.number,
        nodeId: response.node_id,
        url:    response.html_url,
        title:  response.title
      };
    } catch (error) {
      // The request may have succeeded server-side before the error surfaced. Check whether
      // the issue actually landed and adopt it, rather than retrying and creating a second copy.
      const recovered = await this._findRecentIssueByTitle(title);

      if (recovered) {
        console.log(`  Recovered #${ recovered.id } — issue was created despite: ${ error.message }`);

        return { ...recovered, title };
      }

      throw new Error(`Failed to create GitHub issue: ${ error.message }`);
    }
  }

  async _findRecentIssueByTitle(title) {
    // Used to confirm whether a failed create actually landed. Deliberately uses the REST
    // list endpoint rather than search: list is immediately consistent, whereas the search
    // index lags by seconds and would miss an issue created moments ago.
    try {
      const labelParam = encodeURIComponent(this.labels.join(','));
      const issues = await this._get(
        `/repos/${ this.org }/${ this.repo }/issues?state=all&labels=${ labelParam }&sort=created&direction=desc&per_page=100`
      );
      const match = issues.find((i) => i.title === title);

      if (!match) return null;

      return {
        id:     match.number,
        nodeId: match.node_id,
        url:    match.html_url,
        state:  match.state
      };
    } catch (e) {
      console.warn(`  Warning: could not verify whether "${ title }" was created: ${ e.message }`);

      return null;
    }
  }

  async _getProjectId() {
    // Cache the project node ID after first fetch — avoids redundant GraphQL calls
    if (this._projectId) return this._projectId;

    const ownerField = this.projectOwnerType === 'org' ? 'organization' : 'user';
    const query = `
      query($login: String!, $number: Int!) {
        ${ ownerField }(login: $login) {
          projectV2(number: $number) { id }
        }
      }
    `;
    const response = await this._projectRequest('POST', '/graphql', {
      query,
      variables: { login: this.org, number: this.project }
    });

    const owner = this.projectOwnerType === 'org' ? response.data.organization : response.data.user;

    this._projectId = owner.projectV2.id;

    return this._projectId;
  }

  async fetchProjectIssueNodeIds() {
    // Fetch all issue node IDs currently on the project board.
    // Used to detect open issues that were never successfully added to the board.
    const projectId = await this._getProjectId();
    const nodeIds = new Set();
    let cursor = null;

    do {
      const res = await this._projectRequest('POST', '/graphql', {
        query: `
          query($projectId: ID!, $cursor: String) {
            node(id: $projectId) {
              ... on ProjectV2 {
                items(first: 100, after: $cursor) {
                  pageInfo { hasNextPage endCursor }
                  nodes {
                    content {
                      ... on Issue { id }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { projectId, cursor }
      });

      if (res.errors) throw new Error(res.errors[0].message);

      const items = res.data?.node?.items;

      for (const node of items?.nodes || []) {
        if (node.content?.id) nodeIds.add(node.content.id);
      }

      cursor = items?.pageInfo?.hasNextPage ? items.pageInfo.endCursor : null;
    } while (cursor);

    return nodeIds;
  }

  async addToProject(issueNodeId) {
    try {
      const projectId = await this._getProjectId();
      const canSetStatus = !!this.statusFieldId && !!this.backlogOptionId;

      // addProjectV2ItemById is idempotent — if already on board it returns the existing item
      const addRes = await this._projectRequest('POST', '/graphql', {
        query: `
          mutation($projectId: ID!, $contentId: ID!) {
            addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
              item { id }
            }
          }
        `,
        variables: { projectId, contentId: issueNodeId }
      });

      if (addRes.errors) throw new Error(addRes.errors[0].message);

      const itemId = addRes.data.addProjectV2ItemById.item.id;

      if (!canSetStatus) {
        console.warn('STATUS_FIELD_ID or BACKLOG_OPTION_ID not set — skipping status assignment');

        return { projectItemId: itemId };
      }

      // Set status to Backlog
      const updateRes = await this._projectRequest('POST', '/graphql', {
        query: `
          mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
            updateProjectV2ItemFieldValue(input: {
              projectId: $projectId
              itemId: $itemId
              fieldId: $fieldId
              value: { singleSelectOptionId: $optionId }
            }) { projectV2Item { id } }
          }
        `,
        variables: {
          projectId,
          itemId,
          fieldId:  this.statusFieldId,
          optionId: this.backlogOptionId
        }
      });

      if (updateRes.errors) throw new Error(updateRes.errors[0].message);

      return { projectItemId: itemId };
    } catch (error) {
      throw new Error(`Failed to add issue to project: ${ error.message }`);
    }
  }
}

export default GitHubClient;
