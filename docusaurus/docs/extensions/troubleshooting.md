# Troubleshooting

## Extension not available in the Rancher catalog

**Symptom:** Your extension is installed but does not appear in the Extensions catalog, or it shows as unavailable.

**Cause:** Rancher filters extensions by version annotations in the Helm chart. If the running Rancher or Kubernetes version falls outside the ranges declared in the chart's `Chart.yaml`, the extension is hidden.

**Fix:** Verify the `catalog.cattle.io/rancher-version` and `catalog.cattle.io/kube-version` annotations in your `pkg/<extension-name>/Chart.yaml` match the versions you are targeting. For example:

```yaml
annotations:
  catalog.cattle.io/rancher-version: ">= 2.10.0-0 < 2.11.0-0"
  catalog.cattle.io/kube-version: ">= 1.28.0-0 < 1.33.0-0"
```

If either annotation is missing or the current version is outside the declared interval, the chart will not appear as available. When in doubt, widen the range or remove the annotation to rule out filtering as the cause.

See the [publishing guide](./publishing.md) for a full list of supported annotations.

---

## Full-page error in standalone dev mode after upgrading `@rancher/shell`

**Symptom:** Running `yarn dev` against an older Rancher instance works fine, but after bumping `@rancher/shell` to a newer version, the app throws a full-page error (for example, on the Cluster Management → Clusters view). The same extension built and loaded via **Developer Load** works correctly.

**Cause:** The extension's shell version is ahead of the target Rancher version. The newer shell calls Rancher API features or depends on store state that does not exist in the older Rancher instance. This mismatch is invisible in developer-load mode because the host Rancher always aligns its own shell with its own version. In standalone mode, however, your extension's shell is the one running — so a version skew becomes visible. ([#18208](https://github.com/rancher/dashboard/issues/18208))

**Fix:**
1. Match your `@rancher/shell` version to the Rancher instance you are developing against. You can find the Rancher version by visiting `<your-rancher-url>/rancherversion`.
2. If you need to develop against multiple Rancher versions, keep separate branches or workspaces pinned to the appropriate shell version.
3. Remember: this only affects `yarn dev` (standalone mode). Building and loading the extension into a different Rancher version will continue to work.

---

## Extension installed but not visible after installation

**Symptom:** Installation reports success, but the extension's UI doesn't appear.

**Fix:** A full page refresh is required after installing an extension — Rancher does not hot-reload the extension registry. Press `Cmd+Shift+R` / `Ctrl+Shift+R` to force a hard reload.

---

## Dev server starts but the UI is blank or broken

**Symptom:** `yarn dev` starts without errors, but the browser shows a blank page or immediate errors.

**Cause:** The `API` environment variable is not set, so the dev server has no Rancher backend to proxy requests to.

**Fix:**

```sh
API=https://<your-rancher-host> yarn dev
```

The `API` value must point to a running Rancher instance. The dashboard will be available at `https://127.0.0.1:8005`.

---

## SSL certificate warning in the browser

**Symptom:** After starting `yarn dev`, the browser shows an untrusted certificate warning before the login page.

**Cause:** The dev server uses a self-signed certificate.

**Fix:** This is expected in local development. Proceed past the warning (on Chrome: **Advanced → Proceed to 127.0.0.1**). No configuration change is needed.

---

## Unit test: peer dependency warning from `@vue/vue3-jest`

**Symptom:** After installing test dependencies, yarn warns that `@vue/vue3-jest` expects Jest 29.x but Jest 30.x is installed.

**Fix:** This warning is harmless. The package works correctly with Jest 30. No action required.

---

## Unit test: `Cannot find module '*.vue'`

**Symptom:** TypeScript raises `TS2307: Cannot find module '../MyComponent.vue'` when running tests.

**Fix:** Do **not** add a manual `shims-vue.d.ts`. The `*.vue` module declaration is already provided by `@rancher/shell` via its published types, which are included when `"shell"` is in the `types` array of your `tsconfig.json`. If the error persists, verify that `@rancher/shell` is installed and that `tsconfig.json` includes:

```json
"types": ["@types/node", "cypress", "rancher", "shell"]
```

---

## Unit test: Jest fails with Babel plugin errors

**Symptom:** Jest throws errors about missing Babel plugins (e.g., `babel-plugin-istanbul`, `transform-require-context`) that are not installed in your extension.

**Cause:** Jest is inheriting Rancher's webpack-oriented `babel.config.js`, which references plugins that are only installed inside `@rancher/shell`, not in your extension's `node_modules`.

**Fix:** Use `configFile: false` in the `babel-jest` transform inside `jest.config.js` (as described in the [unit testing guide](./unit-testing.md)). Do **not** modify or delete `babel.config.js` — it is required by the webpack dev server and build.
