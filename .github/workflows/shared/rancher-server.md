---
# Shared component: a running, bootstrapped Rancher backend plus an installed
# dashboard working tree, for any agentic workflow that needs to exercise the UI.
#
# Import with:  imports: [shared/rancher-server.md]
#
# Provides the setup `steps:` and the Playwright CLI. The importing workflow
# supplies its own `on:`, `permissions:`, `timeout-minutes:` and safe outputs.
# Budget for these steps in the importing workflow's timeout: the k3s and Rancher
# start alone is about five minutes, nearer twenty when the script has to rebuild
# the cluster, and has taken close to forty when every rebuild hung.
tools:
  # CLI mode, not the deprecated MCP mode: it is the only one that can record
  # video (`video-start`/`video-stop`), and it reaches a dev server on localhost
  # without the bridge-IP dance a containerised MCP server needs.
  playwright:
    mode: cli

steps:
  - name: Checkout repository
    uses: actions/checkout@v6.0.2
    with:
      persist-credentials: false
      # Full history. The default depth-1 clone leaves `git log --all -S` with a
      # single commit to search, so every provenance question answers "never
      # used" and every finding is capped at medium confidence.
      fetch-depth: 0
  - name: Setup Node
    uses: actions/setup-node@v6.4.0
    with:
      node-version-file: '.nvmrc'
  - name: Install dependencies
    run: yarn install --frozen-lockfile --ignore-engines
  # Same provisioning as the e2e suite (k3s + Helm), so CI has one way to stand
  # up Rancher. OVERRIDE_UIS=false keeps Rancher's bundled UI: the agent runs
  # its own `yarn dev` against this backend. GITHUB_BASE_REF pins the branch
  # metadata to master, so a manual run from a fork branch still resolves an image.
  - name: Run Rancher
    run: GITHUB_BASE_REF=master OVERRIDE_UIS=false ./scripts/e2e-k3s-start.sh
  # The script publishes Rancher through the k3s ingress on 443, matched by
  # hostname. The agent's sandbox reaches the runner by gateway IP instead, so
  # forward the Rancher service onto a plain port. The loop restarts the forward
  # if it drops; the runner reaps it at the end of the job.
  - name: Publish Rancher on port 9443
    run: |
      nohup bash -c 'while true; do kubectl -n cattle-system port-forward --address 0.0.0.0 svc/rancher 9443:443; sleep 1; done' \
        > /tmp/rancher-port-forward.log 2>&1 &

      for i in $(seq 1 30); do
        STATUS=$(curl --silent --head -k https://127.0.0.1:9443/dashboard/ | awk '/^HTTP/{print $2}')
        echo "Status: ${STATUS:-none} (try ${i}/30)"
        [ "$STATUS" = "200" ] && break
        sleep 2
      done
      if [ "$STATUS" != "200" ]; then
        echo "Rancher did not answer on port 9443"
        cat /tmp/rancher-port-forward.log
        exit 1
      fi
  - name: Bootstrap Rancher (first-login setup)
    run: |
      # Complete the first-login flow via API so the dashboard is fully usable:
      # without it every page redirects to the password-reset screen.
      RANCHER_URL="https://127.0.0.1:9443"
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
---

## Runtime environment

The setup steps have already prepared the following. They cost several minutes each. Never restart or duplicate them.

- **A Rancher backend** on k3s, forwarded to the runner's port 9443. Credentials `admin` / `password`. Already bootstrapped — server URL set, EULA accepted, first-login cleared — so the dashboard is usable straight away
- **Node, with `yarn install` already run.** `yarn lint` and `yarn test:ci` can be invoked directly
- **The Playwright CLI**, invoked as `playwright-cli` from bash

**The Docker socket is not available.** `docker ps`, `docker logs` and every other docker command fail. Nothing here needs them.

### Finding the Rancher address

Which address reaches the backend depends on how this agent is sandboxed. Establish it once, before you need it:

```bash
node -e 'const https=require("https");for(const h of ["172.30.0.1","172.17.0.1","host.docker.internal"]){const r=https.get({host:h,port:9443,path:"/dashboard/",rejectUnauthorized:false,timeout:5000},res=>{console.log(h,"->",res.statusCode);res.resume()});r.on("timeout",()=>r.destroy(new Error("timeout")));r.on("error",e=>console.log(h,"->",e.code||e.message))}'
```

Wherever this prompt writes `<rancher-host>`, substitute the first host that answered `200`.

**Never use `curl` against it.** Copilot CLI denies any `curl` command with a URL in it, whatever the tool allowlist says. Use `node` with the host and port as separate fields, as above.

**Write the address out literally each time.** Shell variables do not survive between bash calls, so exporting it does not work.

**None of them answers:** the backend is unreachable. Skip every step that needs it and say so in the run summary.

`172.30.0.1` is first because the sandbox puts this agent on its own Docker network and that is the gateway back to the runner. The workflow opens runner port 9443 to the sandbox for this.

### Reading GitHub state

**Never use `gh`. It is not authenticated here.** Every `gh issue list`, `gh pr list` and `gh pr diff` returns nothing and exits non-zero. Piped through `2>/dev/null`, that is indistinguishable from an empty backlog — and a run believing the backlog is empty skips the half of its job that produces pull requests.

Read GitHub state through the MCP tools:

| Instead of | Use |
| --- | --- |
| `gh issue list --label X --state open` | `list_issues` with `labels: ["X"], state: "OPEN"` |
| `gh pr list --label X --state open` | `list_pull_requests` with `state: "open"`, then filter by label yourself |
| `gh pr diff <n> --name-only` | `pull_request_read` with `method: "get_files"` |
| `gh pr view <n>` | `pull_request_read` with `method: "get"` |
| `gh issue view <n>` | `issue_read` |

Two details these tools will not warn you about:

- **`state` is spelled differently between them.** `list_issues` takes `OPEN`/`CLOSED` in capitals. `list_pull_requests` takes `open`/`closed`/`all` in lower case. Wrong case is a schema error, not a silent empty result — but never copy one call's spelling into the other
- **`list_pull_requests` has no label parameter.** No server-side filter exists. List them all and match `<bot-label>` yourself

**Prefer `list_*` and `*_read` over the `search_*` tools.** Search is rate limited to 30 requests an hour across every workflow on the repository, and is often already spent before this run starts. The listing tools are plain REST calls under a far higher limit. A `403 API rate limit` from a search tool means you used the wrong tool, not that the run is blocked.

**Prove an empty result before acting on it.** Call `list_issues` once with no label filter as a control. If that also comes back empty on a repository that visibly has issues, the tool is failing rather than the backlog being clear — say so in the run summary instead of proceeding as though there is nothing to remediate.
