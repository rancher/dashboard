---
name: Extension Compatibility Test Runner
run-name: "Extension Compatibility Test Runner - ${{ inputs.version_label }}"
description: |
  Tests extension compatibility against a specific Rancher version using Playwright CLI.
  Builds a test extension from aalves08/elemental-ui (compatibility-tests-version branch)
  with the latest shell, deploys it via developer-load, and executes ~20 test cases
  covering all Extension Points and Shell API points.

on:
  workflow_dispatch:
    inputs:
      rancher_version:
        description: "Rancher Docker image tag (e.g., head, v2.14-head, v2.13-head)"
        required: true
        type: string
      rancher_registry:
        description: "Docker registry for Rancher image (empty for Docker Hub)"
        required: false
        type: string
        default: ""
      version_label:
        description: "Human-readable version label (e.g., 2.14, latest)"
        required: true
        type: string
      skip_shell_api_tests:
        description: "Skip Shell API tests (true for versions < 2.14)"
        required: false
        type: string
        default: "true"
      skip_tab_resource_detail_page:
        description: "Skip Tab RESOURCE_DETAIL_PAGE tests (true for versions < 2.12.6)"
        required: false
        type: string
        default: "true"
      skip_table_hook:
        description: "Skip Table Hook test (true for versions < 2.14)"
        required: false
        type: string
        default: "true"
      skip_about_top:
        description: "Skip PanelLocation.ABOUT_TOP test (true for versions < 2.13)"
        required: false
        type: string
        default: "true"
      skip_cluster_create_rke2:
        description: "Skip Tab CLUSTER_CREATE_RKE2 test (true for versions < 2.13)"
        required: false
        type: string
        default: "true"
      extension_repo:
        description: "Test extension git repo URL"
        required: false
        type: string
        default: "https://github.com/aalves08/elemental-ui.git"
      extension_branch:
        description: "Test extension git branch or tag"
        required: false
        type: string
        default: "compatibility-tests-version"

concurrency:
  group: "gh-aw-${{ github.workflow }}"
  cancel-in-progress: false
  job-discriminator: ${{ inputs.version_label }}

if: github.repository_owner == 'rancher' || vars.ENABLE_AGENTIC_WORKFLOWS == 'true'

permissions: read-all

network:
  allowed:
    - defaults
    - playwright
    - node
    - local
    - "172.17.0.1"
    - "stgregistry.suse.com"

checkout:
  fetch-depth: 1

env:
  RANCHER_HOST_HTTPS_PORT: "443"
  RANCHER_HOST_HTTP_PORT: "9080"
  RANCHER_CONTAINER_NAME: "rancher-ext-test"
  CATTLE_BOOTSTRAP_PASSWORD: "password"
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1"

steps:
  - name: Setup env
    uses: actions/setup-node@v6.4.0
    with:
      node-version-file: '.nvmrc'

  - name: Install packages
    run: yarn install --frozen-lockfile --ignore-engines

  - name: Install and start Verdaccio
    run: |
      set +e
      which verdaccio > /dev/null
      RET=$?
      set -e
      if [ $RET -ne 0 ]; then
        npm install -g verdaccio
      fi
      verdaccio > verdaccio.log 2>&1 &
      sleep 10
      echo "Configuring Verdaccio user"
      if [ -f ~/.config/verdaccio/htpasswd ]; then
        sed -i.bak -e '/^admin:/d' ~/.config/verdaccio/htpasswd
        rm -f ~/.config/verdaccio/htpasswd.bak
      fi
      curl -XPUT -H "Content-type: application/json" \
        -d '{ "name": "admin", "password": "admin" }' \
        'http://localhost:4873/-/user/admin' > login.json
      TOKEN=$(jq -r .token login.json)
      rm login.json
      cat > ~/.npmrc << NPMEOF
      //127.0.0.1:4873/:_authToken="$TOKEN"
      //localhost:4873/:_authToken="$TOKEN"
      NPMEOF

  - name: Publish shell to Verdaccio
    run: |
      SHELL_VERSION="99.99.99"
      VERDACCIO_NPM_REGISTRY="http://localhost:4873"
      # Patch version numbers
      sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\(-alpha\.[0-9]*\|-release[0-9]*.[0-9]*.[0-9]*\|-rc\.[0-9]*\)\{0,1\}\",/\"version\": \"${SHELL_VERSION}\",/g" shell/package.json
      rm shell/package.json.bak
      sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\(-alpha\.[0-9]*\|-release[0-9]*.[0-9]*.[0-9]*\|-rc\.[0-9]*\)\{0,1\}\",/\"version\": \"${SHELL_VERSION}\",/g" pkg/rancher-components/package.json
      rm pkg/rancher-components/package.json.bak
      sed -i.bak -e "s/\"version\": \"[0-9]*.[0-9]*.[0-9]*\(-alpha\.[0-9]*\|-release[0-9]*.[0-9]*.[0-9]*\|-rc\.[0-9]*\)\{0,1\}\",/\"version\": \"${SHELL_VERSION}\",/g" creators/extension/package.json
      rm creators/extension/package.json.bak
      export NPM_REGISTRY=${VERDACCIO_NPM_REGISTRY}
      export TAG="shell-pkg-v${SHELL_VERSION}"
      shell/scripts/publish-shell.sh
      export TAG="creators-pkg-v${SHELL_VERSION}"
      shell/scripts/publish-shell.sh
      yarn build:lib
      npm set registry ${VERDACCIO_NPM_REGISTRY}
      yarn config set registry ${VERDACCIO_NPM_REGISTRY}
      yarn publish:lib

  - name: Clone and build test extension
    run: |
      SHELL_VERSION="99.99.99"
      DEFAULT_NPM_REGISTRY="https://registry.npmjs.org/"
      VERDACCIO_NPM_REGISTRY="http://localhost:4873"
      # Clone with default registry for initial deps
      yarn config set registry ${DEFAULT_NPM_REGISTRY}
      git clone --depth 1 --branch ${{ github.event.inputs.extension_branch }} \
        ${{ github.event.inputs.extension_repo }} /tmp/elemental-ui
      cd /tmp/elemental-ui
      # Strip RC/pre-release suffixes from extension version to avoid
      # CRD version parsing bugs in Rancher <= 2.13 (split('-').pop() breaks on RC versions)
      sed -i.bak -e 's/\("version": "[0-9]*\.[0-9]*\.[0-9]*\)-[^"]*"/\1"/g' pkg/elemental/package.json
      rm pkg/elemental/package.json.bak
      yarn install --frozen-lockfile
      # Switch to Verdaccio to get local shell
      yarn config set registry ${VERDACCIO_NPM_REGISTRY}
      sed -i.bak -e "s/\"\@rancher\/shell\": \"[0-9]*.[0-9]*.[0-9]*\",/\"\@rancher\/shell\": \"${SHELL_VERSION}\",/g" package.json
      rm package.json.bak
      yarn add @rancher/shell@${SHELL_VERSION} -W
      # Patch source for backward compatibility: guard methods that don't exist in older Rancher versions
      sed -i 's/\$plugin\.addTableHook(/typeof \$plugin.addTableHook === "function" \&\& \$plugin.addTableHook(/g' pkg/elemental/index.ts
      yarn build-pkg elemental
      # Copy built extension back to workspace
      cp -r dist-pkg ${{ github.workspace }}/dist-pkg
      # Reset registry
      yarn config set registry ${DEFAULT_NPM_REGISTRY}

  - name: Start extension server
    run: |
      cd ${{ github.workspace }}
      sudo PORT=80 nohup node shell/scripts/serve-pkgs > serve-pkgs.log 2>&1 &
      echo $! > serve-pkgs.pid
      sleep 3
      echo "Extension server started, verifying catalog..."
      curl -s http://127.0.0.1:80/ | head -20

  - name: Start Rancher Docker
    env:
      RANCHER_HOST_HTTP_PORT: "9080"
      RANCHER_HOST_HTTPS_PORT: "443"
      RANCHER_CONTAINER_NAME: "rancher-ext-test"
    run: |
      REGISTRY="${{ github.event.inputs.rancher_registry }}"
      VERSION="${{ github.event.inputs.rancher_version }}"
      if [ -n "$REGISTRY" ]; then
        echo "Pulling from registry: ${REGISTRY}"
        docker pull "${REGISTRY}/rancher/rancher:${VERSION}"
        docker tag "${REGISTRY}/rancher/rancher:${VERSION}" "rancher/rancher:${VERSION}"
      fi
      echo "Starting Rancher with tag: ${VERSION}"
      ./scripts/e2e-docker-start "${VERSION}" || true

  - name: Wait for Rancher to be ready
    run: |
      echo "Waiting for Rancher dashboard (up to 5 minutes)..."
      for i in $(seq 1 60); do
        STATUS=$(curl -sk -o /dev/null -w "%{http_code}" https://127.0.0.1/dashboard/ 2>/dev/null || echo "000")
        echo "Status: $STATUS (Try: $i/60)"
        if [ "$STATUS" = "200" ]; then
          echo "Dashboard is ready!"
          exit 0
        fi
        sleep 5
      done
      echo "Dashboard did not become available in 5 minutes"
      docker logs rancher-ext-test --tail 50 || true
      exit 1

  - name: Bootstrap Rancher (first-login setup)
    run: |
      RANCHER_URL="https://127.0.0.1"
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

  - name: Prepare Playwright output directory
    run: |
      mkdir -p /tmp/gh-aw/ext-test-evidence
      chmod 777 /tmp/gh-aw/ext-test-evidence

safe-outputs:
  mentions: false
  allowed-github-references: []
  create-issue:
    title-prefix: "[extension-test] "
    labels: [bot/extension-test]
    expires: 7d
    max: 1
  noop:

tools:
  playwright:
    mode: cli
  bash: true
  web-fetch:
  github:
    toolsets: [all]
  repo-memory:
    branch-name: memory/extension-test
    max-file-size: 102400
    max-patch-size: 102400
    file-glob: ["*.md"]

timeout-minutes: 120

engine: copilot
---

# Extension Compatibility Test Runner

You are an **extension compatibility test runner agent**. Your job is to load a
test extension into a running Rancher instance and execute a fixed set of test
cases using **Playwright CLI** browser automation. You verify that Extension Points
and Shell API features work correctly.

**Rancher version**: `${{ github.event.inputs.version_label }}`

## Runtime Environment

- Rancher Dashboard is running at `https://172.17.0.1/dashboard/` (started by prior workflow steps)
- Admin credentials: username `admin`, password `password`
- Extension server is running at `http://172.17.0.1:80` (serves the built test extension)
- You run inside an AWF sandbox. Use `172.17.0.1` (Docker bridge gateway) to reach host services, NOT `localhost`
- Use `playwright-cli <command>` in bash to drive the browser
- **IMPORTANT**: Rancher uses a self-signed certificate. You MUST configure Playwright to ignore HTTPS errors before any navigation (see Step 0.5)
- **IMPORTANT**: The AWF sandbox sets `HTTPS_PROXY`/`HTTP_PROXY` env vars. You MUST unset them before every `playwright-cli` command that navigates to Rancher

## Playwright CLI Usage

All browser interactions are done via `playwright-cli` commands in bash:

```bash
# Open browser and navigate
playwright-cli open "https://172.17.0.1/dashboard/"
playwright-cli goto "https://172.17.0.1/dashboard/"

# Take an accessibility snapshot (shows page structure with element refs)
playwright-cli snapshot

# Click an element by ref (from snapshot output)
playwright-cli click e15

# Click by test ID
playwright-cli click "getByTestId('submit-button')"

# Fill text into an input field
playwright-cli fill e12 "some text"
playwright-cli fill e12 "some text" --submit   # fill + press Enter

# Type text into the currently focused element
playwright-cli type "hello world"

# Press a key
playwright-cli press Enter

# Take a screenshot
playwright-cli screenshot --filename /tmp/gh-aw/ext-test-evidence/screenshot.png

# Evaluate JavaScript in the page
playwright-cli eval "document.title"
playwright-cli eval "document.querySelector('[data-testid=\"some-id\"]') !== null"

# Read browser console messages
playwright-cli console

# Video recording
playwright-cli video-start /tmp/gh-aw/ext-test-evidence/video.webm
playwright-cli video-chapter "Test 1.1"
playwright-cli video-stop

# Check/uncheck checkboxes
playwright-cli check e20
playwright-cli uncheck e20

# Hover over an element
playwright-cli hover e15

# Navigate back/forward/reload
playwright-cli go-back
playwright-cli go-forward
playwright-cli reload
```

Use `playwright-cli snapshot` to see the page structure and find element refs (e.g., `e15`)
before clicking or filling. Always snapshot first, then interact.

## Retry Policy

Before marking any individual test as **FAILED**, you MUST **retry it up to 3 times**.
Between retries:
1. Navigate back to a known page (e.g., home page)
2. Wait 3 seconds
3. Re-attempt the test from step 1

A test is only FAILED after **3 consecutive failures**. Record retry counts in results
(e.g., "PASSED (attempt 2/3)" or "FAILED (3/3 attempts)").

## Step 0 - Read Learnings

Read learnings from previous runs if they exist:

```bash
echo "=== Learnings ==="
cat /tmp/gh-aw/repo-memory/extension-test/learnings.md 2>/dev/null || echo "(none)"
echo ""
echo "=== Selectors ==="
cat /tmp/gh-aw/repo-memory/extension-test/selectors.md 2>/dev/null || echo "(none)"
```

## Step 0.5 - Configure Playwright for Self-Signed Certificates (MANDATORY)

**You MUST complete this step before ANY `playwright-cli open` or `playwright-cli goto` command.
Rancher uses a self-signed certificate and the extension server uses HTTP while Rancher uses HTTPS.
Without this config, Playwright will fail with SSL errors or Mixed Content blocking.
Do NOT skip this step.**

1. Create the Playwright config to ignore HTTPS errors AND allow mixed content (HTTP scripts on HTTPS pages):
```bash
mkdir -p ~/.playwright && cat > ~/.playwright/cli.config.json << 'EOF'
{
  "browser": {
    "contextOptions": {
      "ignoreHTTPSErrors": true
    },
    "launchOptions": {
      "args": [
        "--allow-running-insecure-content",
        "--unsafely-treat-insecure-origin-as-secure=http://172.17.0.1"
      ]
    }
  }
}
EOF
cat ~/.playwright/cli.config.json
```
2. Verify the config file was created and contains both `ignoreHTTPSErrors: true` and the `launchOptions.args`
3. From this point on, **always unset proxy env vars** before `playwright-cli` commands that navigate:
```bash
unset https_proxy HTTPS_PROXY HTTP_PROXY http_proxy && playwright-cli open "https://172.17.0.1/dashboard/"
```

**Every `playwright-cli open`, `goto`, and `snapshot` command MUST be prefixed with:**
```bash
unset https_proxy HTTPS_PROXY HTTP_PROXY http_proxy &&
```

## Step 0.7 - Start Video Recording (MANDATORY)

**You MUST complete this step before proceeding to Step 1. Do NOT skip it.**

Video recording requires ffmpeg AND an open browser session. Follow this exact order:

1. Install ffmpeg (required by Playwright for video encoding):
```bash
npx playwright install ffmpeg
```
2. Open the browser (video-start needs an active browser session):
```bash
unset https_proxy HTTPS_PROXY HTTP_PROXY http_proxy && playwright-cli open "https://172.17.0.1/dashboard/"
```
3. Start video recording:
```bash
playwright-cli video-start /tmp/gh-aw/ext-test-evidence/ext-test-${{ github.event.inputs.version_label }}.webm
```
4. Verify the recording started by checking the command output for success
5. If the `video-start` command fails, retry up to 2 more times with a 3-second wait between attempts
6. If all 3 attempts fail, log the error and continue — but you MUST attempt it 3 times first

## Step 1 - Login to Rancher

The browser should already be open from Step 0.7. If not, open it now.

1. Run `playwright-cli snapshot` to see the login page structure and find element refs
3. Fill the password field using `playwright-cli fill <ref> "password"`
4. Click the "Log In" button using `playwright-cli click <ref>`
5. Wait for the Rancher Dashboard to load, then run `playwright-cli snapshot` to confirm
6. Run `playwright-cli screenshot --filename /tmp/gh-aw/ext-test-evidence/01-login-success.png`

## Step 2 - Developer-Load the Extension

The test extension was built and is being served at `http://172.17.0.1:80`.

### 2.0 Discover the extension details and build the developer-load values
Before loading the extension, query the extension server catalog and compute the exact URL and module name:
```bash
curl -s http://172.17.0.1:80/ | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data:
    name = p['name']
    version = p['version']
    main = p.get('main', 'N/A')
    module = f'{name}-{version}'
    url = f'http://172.17.0.1:80/{module}/{main}'
    print(f'EXTENSION_URL={url}')
    print(f'MODULE_NAME={module}')
"
```
Save these two values — you will need them in Step 2.2:
- **EXTENSION_URL**: the full path to the UMD JS bundle (e.g. `http://172.17.0.1:80/elemental-3.0.2/elemental-3.0.2.umd.min.js`)
- **MODULE_NAME**: `{name}-{version}` (e.g. `elemental-3.0.2`)

### 2.1 Enable Extension Developer Features
1. Click on the user avatar in the header (use `playwright-cli snapshot` to find it, then `playwright-cli click <ref>`)
2. Click "Preferences"
3. Under "Advanced Features", tick "Enable Extension developer features"
4. Screenshot: `playwright-cli screenshot --filename /tmp/gh-aw/ext-test-evidence/02-dev-features-enabled.png`

### 2.2 Developer-Load the Extension
1. Navigate to the Extensions page via the sidebar menu
2. Click on the 3-dot menu (kebab menu)
3. Select "Developer Load"
4. In the "Extension URL" field, fill the **EXTENSION_URL** from Step 2.0 (the full path to the UMD JS bundle, NOT the base URL)
5. In the "Extension module name" field, fill the **MODULE_NAME** from Step 2.0 (`{name}-{version}`, e.g. `elemental-3.0.2`). The field may auto-fill incorrectly — always clear it and set the correct value
6. Check the "Persist extension by creating custom resource" checkbox (this ensures the extension survives page reloads)
7. **Before clicking Load**, use `playwright-cli snapshot` to verify all three fields:
   - Extension URL contains the full path to the `.umd.min.js` file
   - Module name is `{name}-{version}` (NOT just the name, NOT the URL hostname)
   - Persist checkbox is checked
8. Click "Load"
9. Wait for the extension loaded notification to appear
10. Reload the page and verify the extension is listed on the Extensions page
11. Screenshot: `playwright-cli screenshot --filename /tmp/gh-aw/ext-test-evidence/03-extension-loaded.png`

**If the extension fails to load**, check the browser console for errors:
- `curl -s http://172.17.0.1:80/` — verify the extension server is reachable
- `curl -s -o /dev/null -w "%{http_code}" <EXTENSION_URL>` — verify the JS bundle exists at the URL from Step 2.0
- If you see "Mixed Content" errors, the Playwright config from Step 0.5 was not applied correctly. Verify that `~/.playwright/cli.config.json` contains the `launchOptions.args` with `--allow-running-insecure-content`. You may need to close and reopen the browser for the config to take effect
- **Do NOT** debug by reading Rancher source code or trying alternative URL patterns — use the exact values from Step 2.0

## Selector Fallback Strategy

Some extension-injected elements may not have `data-testid` attributes in all Rancher versions. When looking for an element, **always try `data-testid` first**, then fall back to `aria-label` or text-based selectors.

Use this pattern to check and fall back:
```bash
# Try data-testid first, then aria-label
playwright-cli eval "
  document.querySelector('[data-testid=\"TESTID\"]') ||
  document.querySelector('[aria-label=\"ARIA_LABEL\"]')
  ? 'found' : 'not found'
"
```

When clicking an element with fallback:
```bash
# Try clicking by data-testid, if not found try aria-label
playwright-cli eval "
  const el = document.querySelector('[data-testid=\"TESTID\"]') ||
             document.querySelector('[aria-label=\"ARIA_LABEL\"]');
  if (el) { el.click(); 'clicked'; } else { 'not found'; }
"
```

If **neither** `data-testid` nor `aria-label` finds the element, use `playwright-cli snapshot` to inspect the page structure and locate the element by its visible text or position.

### Fallback selector reference

| Test | Primary (`data-testid`) | Fallback (`aria-label`) |
|------|------------------------|------------------------|
| 1.1 | `extension-header-action-action-one` | _(use snapshot to find action button in header)_ |
| 1.2 | `extension-header-action-action-two` | _(use snapshot to find action button in header)_ |
| 2.1 | `btn-detail-page-id` | `detail-page-label` |
| 2.2 | `btn-create-page-id` | `create-page-label` |
| 2.3 | `btn-edit-page-id` | `edit-page-label` |
| 2.4 | `btn-show-configuration-id` | `show-configuration-label` |
| 2.5 | `tab-cluster-create-rke2-id` | `cluster-create-rke2-label` |
| 2.6 | `btn-pod-detail-id` | `pod-detail-label` |

For tests 3.x–8.x, elements are already identified by visible text content (banner text, button labels, column headers), so no `data-testid` fallback is needed.

---

## Step 3 - Execute Test Cases

**Pre-flight checklist — confirm ALL before proceeding:**
- [ ] Video recording started in Step 0.7
- [ ] Evidence directory exists at `/tmp/gh-aw/ext-test-evidence/`

Execute ALL test cases below. Even if earlier tests fail, continue with the remaining ones.
Always take screenshots with absolute paths under `/tmp/gh-aw/ext-test-evidence/`.

Remember the retry policy: retry each test up to 3 times before marking as FAILED.
Apply the **Selector Fallback Strategy** above whenever a `data-testid` selector is not found.

---

### Test Group 1: ActionLocation.HEADER (all versions)

#### Test 1.1: Header Action Button 1
1. Go to the home page via the sidebar menu
2. Check that in the header there's an element with `data-testid="extension-header-action-action-one"`. If not found, use `playwright-cli snapshot` to locate the action button in the header area and click it by ref
3. Click on it
4. Check the browser console for the log message "action executed 1"
5. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-1-1-header-action-one.png`

#### Test 1.2: Header Action Button 2
1. Go to the local cluster via the sidebar menu
2. Check that in the header there's an element with `data-testid="extension-header-action-action-two"`. If not found, use `playwright-cli snapshot` to locate the action button in the header area and click it by ref
3. Click on it
4. Check the browser console for the log message "action executed 2"
5. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-1-2-header-action-two.png`

---

### Test Group 2: Tab Extension Points

#### Test 2.1: Tab RESOURCE_DETAIL_PAGE
**Version gate**: Skip if `${{ github.event.inputs.skip_tab_resource_detail_page }}` is `true`

1. Go to local cluster in the sidebar menu
2. Go to Service Discovery > Services list page
3. Click on any given service to check the details page
4. A new tab should appear with an element with `data-testid="btn-detail-page-id"`. **Fallback**: if not found, look for `aria-label="detail-page-label"`
5. Click on that tab
6. New tab content should appear with text "THIS IS A DEMO TAB"
7. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-2-1-tab-resource-detail-page.png`

#### Test 2.2: Tab RESOURCE_CREATE_PAGE
**Version gate**: Skip if `${{ github.event.inputs.skip_tab_resource_detail_page }}` is `true`

1. Go to local cluster in the sidebar menu
2. Go to Service Discovery > Services list page
3. Click on "Create" to create a new service
4. Select "Cluster IP"
5. A new tab should appear with an element with `data-testid="btn-create-page-id"`. **Fallback**: if not found, look for `aria-label="create-page-label"`
6. Click on that tab
7. New tab content should appear with text "THIS IS A DEMO TAB"
8. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-2-2-tab-resource-create-page.png`

#### Test 2.3: Tab RESOURCE_EDIT_PAGE
**Version gate**: Skip if `${{ github.event.inputs.skip_tab_resource_detail_page }}` is `true`

1. Go to local cluster in the sidebar menu
2. Go to Service Discovery > Services list page
3. On any service listed, go to the table row actions and click "Edit Config"
4. A new tab should appear with an element with `data-testid="btn-edit-page-id"`. **Fallback**: if not found, look for `aria-label="edit-page-label"`
5. Click on that tab
6. New tab content should appear with text "THIS IS A DEMO TAB"
7. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-2-3-tab-resource-edit-page.png`

#### Test 2.4: Tab RESOURCE_SHOW_CONFIGURATION
**Version gate**: Skip if `${{ github.event.inputs.skip_tab_resource_detail_page }}` is `true`

1. Go to local cluster in the sidebar menu
2. Go to Service Discovery > Services list page
3. Click on any given service to check the details page
4. Click on "Show Configuration"
5. A new tab should appear with an element with `data-testid="btn-show-configuration-id"`. **Fallback**: if not found, look for `aria-label="show-configuration-label"`
6. Click on that tab
7. New tab content should appear with text "THIS IS A DEMO TAB"
8. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-2-4-tab-resource-show-config.png`

#### Test 2.5: Tab CLUSTER_CREATE_RKE2
**Version gate**: Skip if `${{ github.event.inputs.skip_cluster_create_rke2 }}` is `true`

1. Go to "Cluster Management" in the sidebar menu
2. Click "Create"
3. Select "Custom" cluster
4. A new tab should appear with an element with `data-testid="tab-cluster-create-rke2-id"`. **Fallback**: if not found, look for `aria-label="cluster-create-rke2-label"`
5. Click on that tab
6. New tab content should appear with text "THIS IS A DEMO TAB"
7. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-2-5-tab-cluster-create-rke2.png`

#### Test 2.6: Tab RESOURCE_DETAIL (legacy)
**Note**: This is the legacy tab extension point, available up until v2.14.0

1. Go to local cluster in the sidebar menu
2. Go to Workloads > Pods list page
3. Click on any given pod to check the details page
4. A new tab should appear with an element with `data-testid="btn-pod-detail-id"`. **Fallback**: if not found, look for `aria-label="pod-detail-label"`
5. Click on that tab
6. New tab content should appear with text "THIS IS A DEMO TAB"
7. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-2-6-tab-resource-detail-legacy.png`

---

### Test Group 3: ActionLocation.TABLE (all versions)

#### Test 3.1: Table Action (non-bulkable)
1. Go to local cluster in the sidebar menu
2. Go to Apps > Repositories list page
3. On any Repo listed, go to the table row actions (3-dot menu on the row)
4. Check that there's a table action called "Demo table action"
5. Click on it
6. Check the browser console for the log message "table action executed 1"
7. On any Repo listed, go to the table row actions again
8. Check that there's a table action called "Demo bulkable action"
9. Click on it
10. Check the browser console for the log message "table action executed 2"
11. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-3-1-table-action-non-bulkable.png`

#### Test 3.2: Table Action (bulkable)
1. Go to local cluster in the sidebar menu
2. Go to Apps > Repositories list page
3. Select a couple of Repos using the checkbox on the left of them
4. There should be appearing above the list an enabled button with the text "Demo bulkable action"
5. Click on it
6. Check the browser console for the log message "table action executed 2"
7. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-3-2-table-action-bulkable.png`

---

### Test Group 4: PanelLocation Extension Points (all versions unless noted)

#### Test 4.1: PanelLocation.RESOURCE_LIST
1. Go to local cluster in the sidebar menu
2. Go to Apps > Repositories list page
3. There should be a banner displayed with the text "Just a sample banner to show that we can render anything here"
4. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-4-1-panel-resource-list.png`

#### Test 4.2: PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (details view)
1. Go to local cluster in the sidebar menu
2. Go to Apps > Repositories list page
3. Click on any Repo to see the details page
4. There should be a banner displayed with the text "This is a generic masthead component example"
5. There should be a banner displayed with the text "This is an example on DetailTop"
6. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-4-2-panel-details-masthead-top.png`

#### Test 4.3: PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (edit view)
1. Go to local cluster in the sidebar menu
2. Go to Apps > Repositories list page
3. On any Repo listed, go to the table row actions and click "Edit Config"
4. There should be a banner displayed with the text "This is a generic masthead component example"
5. There should be a banner displayed with the text "This is another component example for masthead details - edit view"
6. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-4-3-panel-details-edit-view.png`

#### Test 4.4: PanelLocation.ABOUT_TOP
**Version gate**: Skip if `${{ github.event.inputs.skip_about_top }}` is `true`

1. Go to the About page from the sidebar menu (click on version number on bottom of sidebar)
2. There should be a banner displayed with the text "Just a sample banner to show that we can render anything here"
3. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-4-4-panel-about-top.png`

---

### Test Group 5: CLUSTER_DASHBOARD_CARD (all versions)

#### Test 5.1: Dashboard Card
1. Go to local cluster in the sidebar menu
2. Check that there's a new card on the cluster explorer page with the text "Demo card title 1"
3. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-5-1-cluster-dashboard-card.png`

---

### Test Group 6: Table Hook & Table Columns

#### Test 6.1: Table Hook
**Version gate**: Skip if `${{ github.event.inputs.skip_table_hook }}` is `true`

1. Go to local cluster in the sidebar menu
2. Go to Workloads > Pods list page
3. Check the browser console for the log message "TABLE HOOK TRIGGERED"
4. Apply a filter to the Pods list view
5. Check the browser console for another "TABLE HOOK TRIGGERED" message
6. Apply sorting to any table column in the Pods list view
7. Check the browser console for another "TABLE HOOK TRIGGERED" message
8. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-6-1-table-hook.png`

#### Test 6.2: Add Table Column 1 - Custom Formatter
1. Go to local cluster in the sidebar menu
2. Go to Storage > Secrets list page
3. There should be a new table column with the label "Extension Col - Example 1"
4. The table cell value should contain the text "Formatter: Custom Cell Value 1"
5. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-6-2-table-column-1.png`

#### Test 6.3: Add Table Column 2 - Pagination
1. Go to local cluster in the sidebar menu
2. Go to Storage > ConfigMaps list page
3. There should be a new table column with the label "Extension Col - Example 2"
4. The table cell value should contain the text "Custom Cell Value 2" OR the name of the resource (same as "Name" column value)
5. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-6-3-table-column-2.png`

---

### Test Group 7: Shell API Tests
**Version gate**: Skip ALL tests in this group if `${{ github.event.inputs.skip_shell_api_tests }}` is `true`

#### Test 7.1: Slide-in API
1. Go to the Elemental extension in the sidebar menu
2. Click on the sub-menu entry called "shell-api-demo"
3. Click on "Test Slide-in API"
4. A new slide-in panel should appear with the title "Hello from SlideIn panel!"
5. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-7-1-shell-api-slidein.png`

#### Test 7.2: Modal API
1. Go to the Elemental extension in the sidebar menu
2. Click on the sub-menu entry called "shell-api-demo"
3. Click on "Test Modal API"
4. A new modal should appear with a title "Sample general title"
5. The modal should have a button "Cancel"
6. The modal should have a button "Add"
7. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-7-2-shell-api-modal.png`

#### Test 7.3: Notification API
1. Go to the Elemental extension in the sidebar menu
2. Click on the sub-menu entry called "shell-api-demo"
3. Click on "Test Notification API"
4. A new notification should appear with a title "Some notification title"
5. The notification should have a text body "Hello world! Success!"
6. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-7-3-shell-api-notification.png`

#### Test 7.4: System API
1. Go to the Elemental extension in the sidebar menu
2. Click on the sub-menu entry called "shell-api-demo"
3. Click on "Test System API"
4. The box under "System API Data:" should switch text from "No System Info yet. Press the button to fetch it." to system information containing the keywords: gitCommit, isDevBuild, isPrereleaseVersion, isRancherPrime, kubernetesVersion, rancherVersion
5. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-7-4-shell-api-system.png`

---

### Test Group 8: Elemental Extension Tests (all versions)

#### Test 8.1: Elemental Extension Setup
1. Go to the Elemental extension in the sidebar menu
2. Click on the sub-menu entry called "Dashboard"
3. Click on the button "Install Elemental Operator"
4. Click on the button "Next"
5. Click on the button "Install"
6. Wait for the backend to be successfully installed (terminal should contain "SUCCESS: helm upgrade" and should appear "disconnected")
7. Close the terminal
8. Go to the Elemental extension in the sidebar menu
9. Click on the sub-menu entry called "Dashboard"
10. Page should have title "OS Management Dashboard"
11. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-8-1-elemental-setup.png`

#### Test 8.2: Elemental EDIT/CREATE Interface
1. Go to the Elemental extension in the sidebar menu
2. Click on the sub-menu entry called "Registration Endpoint"
3. Click "Create"
4. Fill the "name" field with "demo-reg-endpoint-1"
5. Click "Create"
6. A new page should appear (details page) with the title/text "Registration Endpoint: demo-reg-endpoint-1" (may be two different HTML elements)
7. Click on the sub-menu entry called "Registration Endpoint"
8. There should be a new table entry with name "demo-reg-endpoint-1"
9. Click on the sub-menu entry called "Dashboard"
10. There should be a new table entry with name "demo-reg-endpoint-1" on the table "Registration Endpoints" in the dashboard view
11. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-8-2-elemental-create.png`

#### Test 8.3: Elemental EDIT/CREATE YAML Interface
1. Go to the Elemental extension in the sidebar menu
2. Click on the sub-menu entry called "Inventory of Machines"
3. Click "Create from YAML"
4. Replace "#string" in `metadata.name` for "demo-mach-inv-1"
5. Click "Create"
6. There should be a new table entry with name "demo-mach-inv-1"
7. Screenshot: `/tmp/gh-aw/ext-test-evidence/test-8-3-elemental-create-yaml.png`

---

## Step 4 - Stop Video and Compile Results

1. Run `playwright-cli video-stop` to finalize the recording
2. Copy evidence into the agent artifact directory so it survives the upload step:
```bash
cp -r /tmp/gh-aw/ext-test-evidence /tmp/gh-aw/agent/ext-test-evidence
```
3. Verify files were captured:
```bash
echo "=== Captured Playwright artifacts ==="
find /tmp/gh-aw/agent/ext-test-evidence -type f -exec ls -lh {} \;
echo "=== Total size ==="
du -sh /tmp/gh-aw/agent/ext-test-evidence/
```

Compile a results summary in this format:

```
## Extension Compatibility Test Results - Rancher ${{ github.event.inputs.version_label }}

**Rancher version**: `${{ github.event.inputs.rancher_version }}`
**Date**: $(date -u +%Y-%m-%dT%H:%M:%SZ)

### Summary
**Total Tests**: <N> | **Passed**: <N> | **Failed**: <N> | **Skipped**: <N>

IMPORTANT: Each row in the results table is ONE test. Count the rows to get the totals.
There are 25 tests total (1.1, 1.2, 2.1-2.6, 3.1, 3.2, 4.1-4.4, 5.1, 6.1-6.3, 7.1-7.4, 8.1-8.3).
Total = Passed + Failed + Skipped. Verify the math matches the number of table rows.

### Results

| # | Test Name | Status | Retries | Screenshot | Notes |
|---|-----------|--------|---------|------------|-------|
| 1.1 | Header Action 1 | PASSED/FAILED/SKIPPED | 1/3 | test-1-1-*.png | ... |
| ... | ... | ... | ... | ... | ... |

### Failure Details (if any)
For each failed test: what was expected, what actually happened, which step failed.

### Evidence Files
- Video: ext-test-*.webm (if captured)
- Screenshots: list all .png files
```

## Step 5 - Create Issue with Results

Use `create-issue` to create a GitHub issue with the full results.

The issue title should be: `[extension-test] Rancher ${{ github.event.inputs.version_label }} - <PASSED/FAILED> (<X>/<Y> tests)`

## Step 6 - Update Learnings (failures only)

Skip this step entirely if all tests passed.

Update files under `/tmp/gh-aw/repo-memory/extension-test/`:

| File | What to write |
|---|---|
| `learnings.md` | Interactions that don't work and workarounds, patterns that do work |
| `selectors.md` | Selectors that were wrong or correct selector mappings |

### Rules for writing learnings
1. Each entry must be actionable for a future agent
2. Before appending, check if the insight already exists
3. If any file exceeds 80 lines, remove the least-actionable entries before appending

After writing, call `push_repo_memory`.

## Rules

- **ALWAYS start video recording before executing tests** — this is mandatory, not optional
- **ALWAYS stop video recording after all tests** — run `playwright-cli video-stop` in Step 4
- **NEVER use `playwright-cli run-code` or write custom Playwright scripts** — use ONLY the built-in `playwright-cli` commands (open, goto, snapshot, click, fill, eval, screenshot, etc.). If a command doesn't work, retry or try a different selector — do NOT fall back to scripting
- **Do NOT debug infrastructure** (proxy configs, squid settings, extension server internals, Rancher source code). If something doesn't work, retry with the provided approach or mark the test as FAILED and move on
- Execute EVERY test case, even if earlier ones fail
- Always take screenshots with absolute paths: `/tmp/gh-aw/ext-test-evidence/<name>.png`
- Be patient with waits — pages may load slowly
- Use `data-testid` selectors as primary, falling back to `aria-label` or text selectors per the **Selector Fallback Strategy** section above
- After all tests, ALWAYS verify evidence files exist (both screenshots AND video)
- If `playwright-cli screenshot` fails, retry once with a different filename
- Respect version gates — check the skip flags before each gated test group
- When checking console logs, use `playwright-cli console` to read browser console output

## CRITICAL — DO NOT DELETE FILES

**NEVER run `rm`, `unlink`, `rmdir`, or any delete command on files under `/tmp/gh-aw/ext-test-evidence/`.**
These files are uploaded as artifacts AFTER the agent finishes. If you delete them, they are lost forever.
Do NOT "free up space", "clean up", or "remove old screenshots". Disk space is not a concern.
This rule has the highest priority and overrides any other consideration.