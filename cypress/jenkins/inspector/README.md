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
| `JENKINS_JOB_PATH` | Workflow env | Job path (default: `rancher_qa/ui-automation-ansible-job`) |
| `GITHUB_ORG` | Workflow env | Target org (default: `rancher`) |
| `GITHUB_REPO` | Workflow env | Target repo (default: `qa-tasks`) |
| `GITHUB_PROJECT_NUMBER` | Workflow env | Project board number (default: `40`) |
| `STATUS_FIELD_ID` | Workflow env | ProjectV2 Status field node ID |
| `BACKLOG_OPTION_ID` | Workflow env | Status option ID for Backlog column |

## Source files

| File | Description |
|---|---|
| `src/inspect.js` | Entrypoint — orchestrates the full inspection run |
| `src/jenkins-client.js` | Jenkins REST API client — fetches builds and test results |
| `src/github-client.js` | GitHub REST/GraphQL client — manages issues and project board |
