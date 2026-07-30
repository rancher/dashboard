# CI Failure Inspector

Automated workflow that queries Jenkins for daily UI automation test failures and creates tracking issues in [`rancher/qa-tasks`](https://github.com/rancher/qa-tasks) on the [UI Automation project board](https://github.com/orgs/rancher/projects/40).

## How it works

```
Jenkins REST API
  └── find batch anchor → collect failing tests per build

GitHub API
  ├── fetch all existing issues upfront (deduplication)
  ├── create new issues with environments table
  ├── reopen closed issues (regression detection)
  └── add to Projects v2 board (Backlog column)
```

## Schedule

Runs automatically **Tue–Sat at 4:00 AM PST** (11:00 UTC) via GitHub Actions, after all Jenkins jobs from the prior day complete. Can also be triggered manually from the [Actions tab](../../../actions/workflows/ci-failure-inspection.yaml) with an optional dry run mode.

## Configuration

| Variable | Source | Description |
|---|---|---|
| `GITHUB_TOKEN` | Vault | Scoped token for creating issues in `rancher/qa-tasks` |
| `JENKINS_AUTH` | Repo secret | Base64-encoded `username:token` for Jenkins REST API |
| `JENKINS_BASE_URL` | Repo secret | Jenkins instance base URL |
| `INSPECTOR_JENKINS_JOB_PATH` | Repo secret | Job path |
| `INSPECTOR_STATUS_FIELD_ID` | Repo secret | ProjectV2 Status field node ID |
| `INSPECTOR_BACKLOG_OPTION_ID` | Repo secret | Status option ID for Backlog column |
| `INSPECTOR_GITHUB_PROJECT_NUMBER` | Repo variable | Project board number |
| `INSPECTOR_BUILD_WINDOW` | Repo variable | Number of recent builds to scan for the batch anchor (default: `50`) |
| `INSPECTOR_ANCHOR_DESCRIPTION` | Repo variable | Jenkins build description that marks the batch start (default: `head · community · @adminUser`) |
| `GITHUB_ORG` | Workflow env | Target org (default: `rancher`) |
| `GITHUB_REPO` | Workflow env | Target repo (default: `qa-tasks`) |

## Source files

| File | Description |
|---|---|
| `src/inspect.js` | Entrypoint — orchestrates the full inspection run |
| `src/jenkins-client.js` | Jenkins REST API client — fetches builds and test results |
| `src/github-client.js` | GitHub REST/GraphQL client — manages issues and project board |
| `src/fetch-utils.js` | Shared fetch utility — timeout and retry logic for all HTTP calls |
