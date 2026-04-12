---
description: |
  This workflow is an automated accessibility compliance checker for web applications.
  Reviews websites against WCAG 2.2 guidelines using Playwright browser automation.
  Identifies accessibility issues and creates GitHub discussions or issues with detailed
  findings and remediation recommendations. Helps maintain accessibility standards
  continuously throughout the development cycle.

on:
  schedule: daily
  workflow_dispatch:

permissions: read-all

network: defaults

safe-outputs:
  mentions: false
  allowed-github-references: []
  create-discussion:
    title-prefix: "${{ github.workflow }}"
    category: "q-a"
    max: 5
  add-comment:
    max: 5

tools:
  playwright:
    args: ["--ignore-https-errors"]
  web-fetch:
  github:
    toolsets: [all]

timeout-minutes: 60

steps:
  - name: Checkout repository
    uses: actions/checkout@v6.0.2
    with:
      fetch-depth: 1
      persist-credentials: false
  - name: Setup env
    uses: actions/setup-node@v6.3.0
    with:
      node-version-file: '.nvmrc'
  - name: Install packages
    run: yarn install --frozen-lockfile --ignore-engines
  - name: Run Rancher
    run: |
      # Same as .github/workflows/test.yaml -> yarn e2e:docker -> scripts/e2e-docker-start
      # Ports 80/443 are reserved by the MCP Gateway, so we remap to 8080/8443
      RANCHER_HOST_HTTP_PORT=8080 RANCHER_HOST_HTTPS_PORT=8443 RANCHER_CONTAINER_NAME=rancher RANCHER_VERSION_E2E=head yarn e2e:docker
  - name: Bootstrap Rancher (first-login setup)
    run: |
      # Complete the first-login flow via API so the dashboard is fully usable.
      # See cypress/jenkins/run.sh rancher_init() for the reference implementation.
      RANCHER_URL="https://127.0.0.1:8443"
      BOOTSTRAP_PASSWORD="password"

      echo "Logging in with bootstrap password..."
      TOKEN=$(curl -sk -X POST "${RANCHER_URL}/v3-public/localProviders/local?action=login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"admin\",\"password\":\"${BOOTSTRAP_PASSWORD}\"}" \
        | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
      echo "Token obtained: ${TOKEN:+yes}"

      echo "Setting server-url..."
      curl -sk -X PUT "${RANCHER_URL}/v3/settings/server-url" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"server-url\",\"value\":\"${RANCHER_URL}\"}"

      echo "Accepting EULA..."
      curl -sk -X PUT "${RANCHER_URL}/v3/settings/eula-agreed" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"eula-agreed\",\"value\":\"$(date +%Y-%m-%dT%H:%M:%S.000Z)\"}"

      echo "Marking first-login as complete..."
      curl -sk -X PUT "${RANCHER_URL}/v3/settings/first-login" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"first-login\",\"value\":\"false\"}"

      echo "Rancher bootstrap complete"
  - name: Pre-create MCP logs directory
    run: |
      # The Playwright MCP container needs write access to the mcp-logs directory.
      # Pre-create it with world-writable permissions to avoid EACCES errors
      # when the container process (running as a different UID) tries to write logs.
      mkdir -p /tmp/gh-aw/mcp-logs/playwright
      chmod 777 /tmp/gh-aw/mcp-logs/playwright
---

# Daily Accessibility Review

Your name is ${{ github.workflow }}.  Your job is to review a website for accessibility best
practices.  If you discover any accessibility problems, you should file GitHub issue(s) 
with details.

Our team uses the Web Content Accessibility Guidelines (WCAG) 2.2.  You may 
refer to these as necessary by browsing to https://www.w3.org/TR/WCAG22/ using
the WebFetch tool.  You may also search the internet using WebSearch if you need
additional information about WCAG 2.2.

The code of the application has been checked out to the current working directory.

Important notes about the runtime environment:
- The Rancher Dashboard is running at `https://127.0.0.1:8443/dashboard/` (started and bootstrapped by prior workflow steps).
- The admin credentials are: username `admin`, password `password`.
- You are running inside a sandboxed container. The Docker socket is NOT available, so do NOT run `docker ps`, `docker logs`, or any docker commands — they will fail.
- If Playwright fails to connect, try waiting a few seconds and retrying. The server uses a self-signed certificate, which is already handled by `--ignore-https-errors`.

Steps:

1. Use the Playwright MCP tool to browse to `https://127.0.0.1:8443/dashboard/`. If you see a login page, log in with username `admin` and password `password`. Review the website for accessibility problems by navigating around, clicking
  links, pressing keys, taking snapshots and/or screenshots to review, etc. using the appropriate Playwright MCP commands.

2. Review the source code of the application to look for accessibility issues in the code.  Use the Grep, LS, Read, etc. tools.

3. Use the GitHub MCP tool to create discussions for any accessibility problems you find.  Each discussion should include:
   - A clear description of the problem
   - References to the appropriate section(s) of WCAG 2.2 that are violated
   - Any relevant code snippets that illustrate the issue