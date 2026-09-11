# Jenkins CI Pipeline

Thin Jenkins wrapper for the Dashboard E2E test pipeline. The actual test
infrastructure (Dockerfile, Cypress config, playbook) lives in the
[qa-infra-automation](https://github.com/rancher/qa-infra-automation/tree/main/ansible/testing/dashboard-e2e)
repo. This directory only contains what Jenkins needs to kick things off.

## Files

| File | What it does |
|------|-------------|
| `Jenkinsfile` | Pipeline stages — pre-clean, preflight, checkout, run tests, grab results, cleanup, report |
| `Jenkinsfile_multi` | Matrix job — fans out across Rancher versions × K8s versions × tag sets |
| `init.sh` | Clones qa-infra-automation, builds runner image, generates vars.yaml, runs playbook in container, streams Cypress |
| `slack-notification.sh` | Posts test results to Slack on failure, with build details read from `notification_values.txt` |

## How it works

```
Jenkinsfile → init.sh → ansible-playbook (provision + setup) → docker run (streaming)
                      ↘ init.sh destroy → ansible-playbook --tags cleanup
```

1. **Jenkinsfile** checks out this repo, runs `init.sh`, collects results, and
   handles cleanup in a `finally` block.

2. **init.sh** clones qa-infra-automation, builds the `dashboard-e2e-runner`
   Docker image (contains ansible, tofu, helm, kubectl), writes `vars.yaml`
   from the `VARS_YAML_CONFIG` Jenkins text area (required), then:
   - Runs the playbook inside the container with `--skip-tags test` (provision + setup)
   - Copies `notification_values.txt` from the playbook dir into the Jenkins
     workspace, where `slack-notification.sh` expects it. The playbook resolves
     `workspace_dir` to its own directory because `WORKSPACE` is not exported into
     the container, so without this copy the Slack message loses all build details.
   - Runs `docker run` directly for real-time Cypress streaming with colors
   - On destroy: runs the playbook with `--tags cleanup,never`

3. **The playbook** handles everything else — provisioning AWS infra, deploying
   Rancher, cloning dashboard, building the Docker image. See the
   [playbook README](https://github.com/rancher/qa-infra-automation/tree/main/ansible/testing/dashboard-e2e)
   for configuration, stage tags, and standalone usage.

## Configuration

All configuration is done via the `VARS_YAML_CONFIG` text area in Jenkins
(required — the job will fail without it).
This is a YAML block that becomes the playbook's `vars.yaml`. See
[vars.yaml.example](https://github.com/rancher/qa-infra-automation/blob/main/ansible/testing/dashboard-e2e/vars.yaml.example)
for all available options.

Jenkins-level parameters (not in vars.yaml):

| Parameter | Default | Description |
|-----------|---------|-------------|
| `BRANCH` | `master` | Branch for Jenkinsfile and init.sh (not test code) |
| `QA_INFRA_BRANCH` | `main` | Branch of qa-infra-automation to clone |
| `CLEANUP` | `true` | Destroy infrastructure after the run (`false`/`no`/`0` to skip) |
| `SLACK_NOTIFICATION` | `true` | Post to Slack on failure |
| `ANSIBLE_VERBOSITY` | `0` | Ansible output verbosity (0–4) |

## Safety & hardening

| Feature | Detail |
|---------|--------|
| **Global timeout** | 240 min (4h) — kills zombie builds |
| **Run Tests timeout** | 180 min (3h) — prevents hung Cypress |
| **Destroy timeout** | 15 min — wrapped in try/catch so cleanup always runs |
| **Disk preflight** | Aborts if < 5 GB free on executor |
| **Container isolation** | `BUILD_TAG` label on all containers; cleanup filters by label |
| **SIGTERM trap** | Kills cypress container on Jenkins abort |
| **Credential wipe** | `vars.yaml` and `.env` deleted in finally block |
| **File permissions** | `vars.yaml` created with `chmod 600` |
| **Build description** | Shows rancher tag, edition (prime/community), cypress tags |
| **Build result** | GREEN = tests pass, YELLOW = tests fail, RED = infra error |

## Tools (in container)

All tools are pre-installed in the `dashboard-e2e-runner` Docker image built
from `Dockerfile.quickstart`. Only Docker and git are needed on the Jenkins
executor.

| Tool | Version | Purpose |
|------|---------|---------|
| OpenTofu | 1.11.5 | AWS infrastructure provisioning |
| Ansible | core < 2.17 | Playbook execution |
| kubectl | v1.29.8 | Cluster verification |
| Helm | 3.17.3 | Chart version resolution |
