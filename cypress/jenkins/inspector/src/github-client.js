/* eslint-disable no-console */
/**
 * GitHub API client for CI Failure Inspector.
 * Manages issue creation, reopening, deduplication, and project board assignment.
 * Configuration is via environment variables — see README.md for the full list.
 */

import { fetchWithRetry } from './fetch-utils.js';

const GH_API = 'https://api.github.com';

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

  async _request(method, path, body) {
    const url = path.startsWith('http') ? path : `${ GH_API }${ path }`;
    const res = await fetchWithRetry(url, {
      method,
      headers: this.headers,
      body:    body ? JSON.stringify(body) : undefined
    });
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

    return `[UI][Auto] ${ failure.suite } > ${ normalizedTitle }`;
  }

  async fetchExistingIssues() {
    // Fetch all [UI][Auto] issues (open + closed) upfront — avoids per-failure search API calls.
    // Filters by the full label set so deduplication doesn't miss issues if labels change.
    // Returns a Map keyed by issue title for O(1) lookup during processing.
    const MAX_PAGES = 20;
    const map = new Map();
    const labelParam = encodeURIComponent(this.labels.join(','));
    let page = 1;

    while (page <= MAX_PAGES) {
      const issues = await this._get(
        `/repos/${ this.org }/${ this.repo }/issues?state=all&labels=${ labelParam }&per_page=100&page=${ page }`
      );

      for (const issue of issues) {
        map.set(issue.title, {
          id:     issue.number,
          nodeId: issue.node_id,
          url:    issue.html_url,
          state:  issue.state
        });
      }

      if (issues.length < 100) break;

      page++;

      if (page > MAX_PAGES) {
        console.warn(`fetchExistingIssues: reached ${ MAX_PAGES }-page ceiling — some older issues may not be loaded`);
      }
    }

    return map;
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
      const response = await this._post(`/repos/${ this.org }/${ this.repo }/issues`, {
        title, body, labels: this.labels
      });

      return {
        id:     response.number,
        nodeId: response.node_id,
        url:    response.html_url,
        title:  response.title
      };
    } catch (error) {
      throw new Error(`Failed to create GitHub issue: ${ error.message }`);
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
