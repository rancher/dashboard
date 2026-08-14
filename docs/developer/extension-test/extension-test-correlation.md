# Extension Compatibility Test — PDF ↔ Spec Correlation

> &#x26a0;&#xfe0f; Documentation in this directory is intended for internal use only. Any information contained here is unsupported.

This document correlates every test case described in [`extension-test.pdf`](./extension-test.pdf)
with the Cypress implementation in
[`cypress/e2e/tests/pages/extensions/extension-compatibility.spec.ts`](../../cypress/e2e/tests/pages/extensions/extension-compatibility.spec.ts),
and records which Rancher versions each case runs on.

- **Workflow:** [`.github/workflows/extension-compatibility-test.yml`](../workflows/extension-compatibility-test.yml)
- **Test extension:** `aalves08/elemental-ui` @ `compatibility-tests-version` (developer-loaded)
- **Versions under test:** 2.10, 2.11, 2.12, 2.13, 2.14, `latest` (head = 2.15)

Every PDF case maps 1:1 to a spec test. The spec groups tests by extension-point family
(`Test Group 1`–`8`).

## Correlation table

| PDF case (extension point) | Spec test | Key assertion | Page / route | Since |
|---|---|---|---|---|
| ActionLocation.HEADER 1 | **1.1** Header Action Button 1 | `extension-header-action-action-one` click + `CMD/CTRL+M` log `action executed 1` | `/home` | v2.7.2 |
| ActionLocation.HEADER 2 | **1.2** Header Action Button 2 | `extension-header-action-action-two` click + `CMD/CTRL+B` log `action executed 2` | `/c/local/explorer` | v2.7.2 |
| Tab RESOURCE_DETAIL_PAGE | **2.1** Tab RESOURCE_DETAIL_PAGE | tab `btn-detail-page-id` → `section#detail-page-id` shows `THIS IS A DEMO TAB` | Service detail | v2.12.6 / v2.13.2 / v2.14.0 |
| Tab RESOURCE_CREATE_PAGE | **2.2** Tab RESOURCE_CREATE_PAGE | select Cluster IP → tab `btn-create-page-id` → demo tab | Service create | v2.12.6 / v2.13.2 / v2.14.0 |
| Tab RESOURCE_EDIT_PAGE | **2.3** Tab RESOURCE_EDIT_PAGE | row `Edit Config` → tab `btn-edit-page-id` → demo tab | Service edit | v2.12.6 / v2.13.2 / v2.14.0 |
| Tab RESOURCE_SHOW_CONFIGURATION | **2.4** Tab RESOURCE_SHOW_CONFIGURATION | `Show Configuration` → tab `btn-show-configuration-id` → demo tab | Service detail | v2.12.6 / v2.13.2 / v2.14.0 |
| Tab CLUSTER_CREATE_RKE2 | **2.5** Tab CLUSTER_CREATE_RKE2 | custom cluster create → tab `tab-cluster-create-rke2-id` → demo tab | Cluster mgmt create (`?type=custom`) | v2.13.0 |
| Tab RESOURCE_DETAIL (legacy) | **2.6** Tab RESOURCE_DETAIL (legacy) | pod detail → tab `btn-pod-detail-id` → demo tab | Pod detail | legacy, up until v2.14.0 |
| ActionLocation.TABLE (not bulkable) | **3.1** Table Action (row actions) | row menu `Demo table action` → log `table action executed 1`; `Demo bulkable action` → `executed 2` | Apps › Repositories | v2.7.2 |
| ActionLocation.TABLE (bulkable) | **3.2** Table Action (bulkable) | select rows → bulk `Demo bulkable action` → log `table action executed 2` | Apps › Repositories | v2.7.2 |
| PanelLocation.RESOURCE_LIST | **4.1** PanelLocation.RESOURCE_LIST | banner `Just a sample banner to show that we can render anything here` | Apps › Repositories list | v2.7.2 |
| PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (details) | **4.2** …(details) | banners `This is a generic masthead component example` + `This is an example on DetailTop` | Repo detail | v2.7.2 |
| PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (edit) | **4.3** …(edit) | banners `generic masthead component example` + `another component example for masthead details - edit view` | Repo edit | v2.7.2 |
| PanelLocation.ABOUT_TOP | **4.4** PanelLocation.ABOUT_TOP | banner `Just a sample banner…` on About page | `/about` | v2.13.0 |
| CLUSTER_DASHBOARD_CARD | **5.1** Dashboard Card | card text `Demo card title 1` | `/c/local/explorer` | v2.7.2 |
| Table Hook | **6.1** Table Hook (load, filter, sort) | `console.error('TABLE HOOK TRIGGERED')` on initial load, on filter, on sort | Pods list | v2.14.0 |
| Add table column 1 (custom formatter) | **6.2** Add Table Column 1 | column `Extension Col - Example 1`, cell `Formatter: Custom Cell Value 1` | Secrets list | v2.7.2 |
| Add table column 2 (pagination) | **6.3** Add Table Column 2 | column `Extension Col - Example 2` | ConfigMaps list | v2.7.2 |
| Shell API — Slide-in | **7.1** Slide-in API | `Test Slide-in API` → `Hello from SlideIn panel!` | Elemental › shell-api-demo | v2.14.0 |
| Shell API — Modal | **7.2** Modal API | `Test Modal API` → `Sample general title`, `Cancel`, `Add` | Elemental › shell-api-demo | v2.14.0 |
| Shell API — Notification | **7.3** Notification API | `Test Notification API` → `Some notification title`, `Hello world! Success!` | Elemental › shell-api-demo | v2.14.0 |
| Shell API — System | **7.4** System API | `Test System API` → `gitCommit`, `isDevBuild`, `isPrereleaseVersion`, `isRancherPrime`, `kubernetesVersion`, `rancherVersion` | Elemental › shell-api-demo | v2.14.0 |
| Elemental — setup | **8.1** Elemental Extension Setup | Install Elemental Operator → Next → Install → `SUCCESS: helm upgrade` → `OS Management Dashboard` | Elemental › Dashboard | — |
| Elemental — EDIT/CREATE | **8.2** Elemental EDIT/CREATE Interface | Registration Endpoint → create `demo-reg-endpoint-1` (URL + list row) | Elemental › Registration Endpoint | — |
| Elemental — EDIT/CREATE YAML | **8.3** Elemental EDIT/CREATE YAML | Inventory of Machines → Create from YAML → `demo-mach-inv-1` | Elemental › Inventory of Machines | — |

> Note: the extension also registers a `TabLocation.OTHER` (`pod-create-id`) which its own source
> marks `TODO ... NOT WORKING`. It is not in the PDF cases and not implemented in the spec.

## Version applicability matrix

✓ = runs & asserts · ⊘ = skipped (extension point not available / not applicable on that version)

| Spec test | 2.10 | 2.11 | 2.12 | 2.13 | 2.14 | 2.15 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| 1.1 Header action 1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 1.2 Header action 2 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2.1 RESOURCE_DETAIL_PAGE | ⊘ | ⊘ | ⊘ | ✓ | ✓ | ✓ |
| 2.2 RESOURCE_CREATE_PAGE | ⊘ | ⊘ | ⊘ | ✓ | ✓ | ✓ |
| 2.3 RESOURCE_EDIT_PAGE | ⊘ | ⊘ | ⊘ | ✓ | ✓ | ✓ |
| 2.4 RESOURCE_SHOW_CONFIGURATION | ⊘ | ⊘ | ⊘ | ✓ | ✓ | ✓ |
| 2.5 CLUSTER_CREATE_RKE2 | ⊘ | ⊘ | ⊘ | ✓ | ✓ | ✓ |
| 2.6 RESOURCE_DETAIL (legacy) | ✓ | ✓ | ✓ | ✓ | ✓ | ⊘ |
| 3.1 Table action (row) | ⊘ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3.2 Table action (bulk) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4.1 RESOURCE_LIST panel | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4.2 DETAILS panels (details) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4.3 DETAILS panels (edit) | ⊘ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 4.4 ABOUT_TOP panel | ⊘ | ⊘ | ⊘ | ✓ | ✓ | ✓ |
| 5.1 Dashboard card | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6.1 Table hook | ⊘ | ⊘ | ⊘ | ⊘ | ✓ | ✓ |
| 6.2 Table column 1 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6.3 Table column 2 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 7.1 Shell API Slide-in | ⊘ | ⊘ | ⊘ | ⊘ | ✓ | ✓ |
| 7.2 Shell API Modal | ⊘ | ⊘ | ⊘ | ⊘ | ✓ | ✓ |
| 7.3 Shell API Notification | ⊘ | ⊘ | ⊘ | ⊘ | ✓ | ✓ |
| 7.4 Shell API System | ⊘ | ⊘ | ⊘ | ⊘ | ✓ | ✓ |
| 8.1 Elemental setup | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 8.2 Elemental create (form) | ⊘ | ⊘ | ⊘ | ⊘ | ✓ | ✓ |
| 8.3 Elemental create (YAML) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Total run / skipped** | **11 / 13** | **13 / 11** | **13 / 11** | **19 / 5** | **25 / 0** | **24 / 1** |

## How version differences are expressed

Differences are driven by the workflow `matrix` skip flags and a few version-gated `if`s in the
spec — the test logic itself is shared across all versions.

### Workflow matrix flags (`extension-compatibility-test.yml`)
| Flag → spec const | Skips | True for |
|---|---|---|
| `skip_tab_resource_detail_page` → `skipTabDetailPage` | 2.1–2.4 | 2.10, 2.11, 2.12 |
| `skip_cluster_create_rke2` → `skipClusterRke2` | 2.5 | 2.10, 2.11, 2.12 |
| `skip_resource_detail_legacy` → `skipResourceDetailLegacy` | 2.6 | 2.15 |
| `skip_about_top` → `skipAboutTop` | 4.4 | 2.10, 2.11, 2.12 |
| `skip_table_hook` → `skipTableHook` | 6.1 | 2.10–2.13 |
| `skip_shell_api_tests` → `skipShellApi` | 7.1–7.4 | 2.10–2.13 |

Boolean-ish `CYPRESS_*` env values are read with an `isSkip()` helper because Cypress coerces
`"true"`/`"false"` to real booleans.

### Spec version-gated `if`s
| Const | Versions | Effect |
|---|---|---|
| `LEGACY_DASHBOARD` | 2.10–2.13 | login via the form + validate by URL (older dashboards don't drive `POST /v1-public/login`); skip 8.2 (older elemental create form has a different tabbed layout) |
| `OLD_DEV_LOAD` | 2.10, 2.11 | idempotent developer-load (delete-then-load), reload banner is optional, switch to Installed tab without the `#installed` URL wait |
| `OLD_ACTION_MENU` | 2.10 | skip 3.1 and 4.3 (2.10's sortable-table row action menu is a different older component) |
| `RANCHER_VERSION === '2.10'` | 2.10 | click "Developer Load" by visible text (older menu isn't tagged `[dropdown-menu-item]`) |

## Notes on skipped coverage

- **2.13** runs the new RESOURCE_* tabs even though the PDF says "v2.12.6+"; in practice the
  extension marks those `TabLocation`s as 2.14+ and they only render from 2.13 onward, so 2.10–2.12
  skip them.
- **8.2 (form create)** is skipped on the legacy dashboards; create is still covered there by
  **8.3 (YAML create)**.
- **2.10 row action menu (3.1, 4.3)**: `ActionLocation.TABLE` is still covered by **3.2** (bulk
  action) and the masthead/detail-top panels by **4.2** (details view).
