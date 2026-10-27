import ExtensionsPagePo from '@/cypress/e2e/po/pages/extensions.po';
import DeveloperLoadDialogPo from '@/cypress/e2e/po/pages/extensions/developer-load.po';
import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import { ServicesPagePo } from '@/cypress/e2e/po/pages/explorer/services.po';
import { SecretsListPagePo } from '@/cypress/e2e/po/pages/explorer/secrets.po';
import { ConfigMapListPagePo } from '@/cypress/e2e/po/pages/explorer/config-map.po';
import ChartRepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import { LoginPagePo } from '@/cypress/e2e/po/pages/login-page.po';
import { createPodBlueprint } from '@/cypress/e2e/blueprints/explorer/workload-pods';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { qase } from '@/cypress/support/qase';
import CodeMirrorPo from '@/cypress/e2e/po/components/code-mirror.po';

// Cypress coerces numeric-looking CYPRESS_* values (e.g. "2.13") to numbers, so stringify it.
const RANCHER_VERSION = String(Cypress.env('rancher_version') ?? '');

// Older dashboard runtimes (2.10-2.13) render the elemental machineregistration create form with a
// different (tabbed) layout.
const LEGACY_DASHBOARD = ['2.10', '2.11', '2.12', '2.13'].includes(RANCHER_VERSION);

// The oldest dashboards (2.10 / 2.11) don't surface the reload banner after a developer load and
// don't navigate to the #installed tab, so the dev-load setup needs an idempotent, banner-tolerant
// path there. 2.12+ show the banner and navigate normally.
const OLD_DEV_LOAD = ['2.10', '2.11'].includes(RANCHER_VERSION);

// 2.10's sortable-table row action menu is a structurally different (older) component: the trigger
// button reports as covered and the menu doesn't use the [dropdown-menu-collection]/[dropdown-menu-item]
// DOM the helpers rely on. The row-action-menu tests (3.1, 4.3) are skipped there; ActionLocation.TABLE
// is still covered by the bulk action (3.2) and the masthead/detail-top panel by the details view (4.2).
const OLD_ACTION_MENU = RANCHER_VERSION === '2.10';

/**
 * Log in through the form, tolerating Rancher version differences in the login request.
 *
 * cy.login() asserts the exact POST /v1-public/login body that a dashboard built from *this* branch
 * sends, so it only holds when the UI under test is this branch's. This suite drives the stock UI
 * shipped with each Rancher version, where that request differs: 2.10-2.13 post to
 * /v3-public/localProviders/local?action=login instead, and 2.14 / 2.15 post to /v1-public/login
 * without the `configName` added in #19495. Rather than track every shape, submit the form and
 * validate by reaching an authenticated page.
 */
const loginCompat = () => {
  const username = Cypress.env('username');
  const password = Cypress.env('password');

  cy.session(['compat', username, password], () => {
    const loginPage = new LoginPagePo();

    LoginPagePo.goTo();
    // Guard against the login page hanging on its loading spinner (see LoginPagePo.ensureFormReady -
    // rancher/dashboard#19320), as cy.login() does. No-op on the happy path.
    loginPage.ensureFormReady();
    loginPage.switchToLocal();
    loginPage.username().set(username);
    loginPage.password().set(password);
    loginPage.submit();
    // Success is detected by navigating away from /auth/login, not by asserting on the login
    // request, whose shape varies across the versions under test.
    cy.location('pathname', { timeout: 120000 }).should('not.contain', '/auth/login');
  });

  // The api-request commands rely on a CSRF token that cy.login() normally caches; set it here
  // since this path bypasses cy.login().
  cy.refreshCsrfToken();
};

// Build the sortable table from a string selector so its `self()` re-queries the DOM on every
// call. Constructing a SortableTablePo from a chainable (e.g. list().resourceTable()...) reuses a
// single consumed chainable, so calls after `filter()` resolve to the search box instead of the table.
const STANDARD_LIST = '[data-testid="sortable-table-list-container"]';
const REPO_LIST = '[data-testid="app-cluster-repo-list"]';

/**
 * Extension compatibility test suite.
 *
 * Developer-loads a stable "compatibility-tests-version" of the elemental-ui extension into a
 * freshly booted Rancher and asserts every extension point / Shell API documented in
 * `.github/prompts/extension-test.pdf`.
 *
 * Version differences are handled via the `CYPRESS_skip_*` env flags wired from the workflow
 * matrix - extension points that don't exist on a given Rancher version are skipped there.
 */

const EXTENSION_SERVER_URL = Cypress.env('extension_server_url') || 'http://127.0.0.1:80';

// Cypress coerces CYPRESS_* values of "true"/"false" into real booleans, so compare against both.
const isSkip = (key: string): boolean => {
  const v = Cypress.env(key);

  return v === true || v === 'true';
};

const skipShellApi = isSkip('skip_shell_api_tests');
const skipTabDetailPage = isSkip('skip_tab_resource_detail_page');
const skipTableHook = isSkip('skip_table_hook');
const skipAboutTop = isSkip('skip_about_top');
const skipClusterRke2 = isSkip('skip_cluster_create_rke2');
// The legacy RESOURCE_DETAIL extension point only exists up until Rancher v2.14.0 (per the PDF).
const skipResourceDetailLegacy = isSkip('skip_resource_detail_legacy');
// Unlike the other flags this is not about a missing extension point. On Rancher 2.15 an extension
// that registers a product through the Product Registration API blanks the Name column on explorer
// lists, so a row can be found and acted on but never matches its own name. Set on 2.15 only; drop
// it (and assertFilteredRow) once the fix is backported to release-2.15.
const noRowNameAssert = isSkip('skip_row_name_assert');

/**
 * Assert the list filter left exactly the one row we created.
 *
 * Matches on the name where the host renders it, and falls back to a row count where it doesn't -
 * see `noRowNameAssert`. Every caller filters on a unique name first, so one row means the right row.
 */
const assertFilteredRow = (table: SortableTablePo, name: string) => (
  noRowNameAssert ? table.rowElements().should('have.length', 1) : table.rowElementWithName(name).should('be.visible')
);

// Group 9's row action menu check drives the extension's own (bundled) sortable table. 2.10's page
// chrome is too old to drive it reliably - the same reason 3.1/4.3 are skipped there - and 2.11 is
// the oldest host still missing `window.__vueRouter`, so #18635 keeps a matrix row either way.
const skipExtRowActionMenu = isSkip('skip_ext_row_action_menu');
// The Resources API (`$resources`) and the Product Registration API (`addProduct`/`extendProduct`)
// both landed in Rancher 2.15, so groups 10 and 11 only run from there on. The extension itself
// feature-detects and degrades on older hosts rather than failing to build.
const skipResourcesApi = isSkip('skip_resources_api');
const skipProductRegistration = isSkip('skip_product_registration');

// On Linux/Windows CI the header-action shortcut combos use 'ctrl', on macOS they use 'meta'
// (see shell/core/plugin-helpers.ts -> shortcutKey { windows: ['ctrl', x], mac: ['meta', x] }).
const MOD_KEY = Cypress.platform === 'darwin' ? '{meta}' : '{ctrl}';

const CLUSTER_ID = 'local';
const NS = 'default';

// Deterministic resources created via API so list pages are never empty regardless of the
// namespace filter (kube-system/cattle-system pods are hidden by default).
const svcName = 'ext-compat-svc';
const podName = 'ext-compat-pod';
const secretName = 'ext-compat-secret';
const cmName = 'ext-compat-cm';

let extensionUrl = '';
let moduleName = '';

// Tagged `@extensionsCompatibility` (NOT `@extensions`) on purpose: this suite needs a
// developer-loaded extension server and a matrix of Rancher versions that only the dedicated
// "Extension Compatibility Test" workflow (.github/workflows/extension-compatibility-test.yml,
// which selects it by --spec) sets up. Keeping it off `@extensions` stops the normal e2e
// GREP_TAGS=@adminUser+@extensions jobs from running it, where it would always fail.
describe('Extension Compatibility', { tags: ['@extensionsCompatibility', '@adminUser'], retries: { runMode: 3, openMode: 0 } }, () => {
  // One-time suite setup (developer-load the extension + create test data). This runs from
  // beforeEach guarded by `setupComplete` rather than a `before` hook: a `before all` hook is
  // never retried, so a single fresh-cluster flake (slow login / side-nav) would fail the whole
  // job. A guarded beforeEach is covered by Cypress test retries. The dev-load is persisted in the
  // cluster and the resources are delete-then-create, so re-running on a retry is safe.
  let setupComplete = false;

  /**
   * Rancher head opens a "what's new" modal after a minor upgrade, which covers the page and makes
   * the extensions menu unclickable. Setting the gating `read-whatsnew` preference does not
   * reliably prevent it - the dialog is decided before preferences have loaded, so it reappears on
   * a retry even once the preference is stored - so dismiss it when it is on screen. Older
   * dashboards have no such dialog and this is a no-op there.
   */
  const dismissReleaseWelcome = () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="release-welcome"]').length) {
        cy.get('[data-testid="release-welcome-close"]').click({ force: true });
        cy.get('[data-testid="release-welcome"]').should('not.exist');
      }
    });
  };

  const runSetup = () => {
    loginCompat();

    // Discover extension details from the locally-served catalog (serve-pkgs output)
    cy.request(`${ EXTENSION_SERVER_URL }/`).then((resp) => {
      const ext = resp.body[0];

      moduleName = `${ ext.name }-${ ext.version }`;
      extensionUrl = `${ EXTENSION_SERVER_URL }/${ moduleName }/${ ext.main }`;
    });

    // Enable extension developer features. `read-whatsnew` marks the release-welcome modal as seen
    // (see dismissReleaseWelcome) - it does not reliably suppress it, but it costs nothing here.
    cy.setUserPreference({ 'plugin-developer': true, 'read-whatsnew': '99.99.99' });

    if (OLD_DEV_LOAD) {
      // The oldest dashboards don't surface the reload banner after a developer load, so setup can
      // retry; ensure a clean dev-load by removing any plugin left from a previous attempt (the
      // install POST 409s if it already exists).
      cy.then(() => {
        cy.deleteRancherResource('v1', 'catalog.cattle.io.uiplugins', `cattle-ui-plugin-system/${ moduleName }`, false);
      });
    }

    // Warm up the local cluster first - on a freshly booted Rancher the explorer/uiplugins
    // pages can race the cluster becoming ready. Wait on the product side-nav (renders as soon as
    // the cluster route loads) rather than the dashboard glance card, which is metrics-driven and
    // itself slow/flaky on a fresh cluster.
    cy.visit(`/c/${ CLUSTER_ID }/explorer`);
    cy.get('.side-nav', { timeout: 120000 }).should('be.visible');
    dismissReleaseWelcome();

    // Developer-load the extension
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    // Long timeout - the uiplugins page can take a while to render right after boot.
    cy.get('[data-testid="extensions-page-title"]', { timeout: 120000 }).should('contain', 'Extensions');
    dismissReleaseWelcome();
    extensionsPo.extensionMenuToggle();
    if (RANCHER_VERSION === '2.10') {
      // 2.10's older menu doesn't tag items with [dropdown-menu-item]; click the visible entry.
      cy.contains('Developer Load').should('be.visible').click();
    } else {
      new ActionMenuPo(extensionsPo.self()).getMenuItem('Developer Load').click();
    }

    const devLoadDialog = new DeveloperLoadDialogPo();

    cy.then(() => {
      devLoadDialog.fillAndLoad(extensionUrl, moduleName, true);
    });

    // After a developer load, Rancher surfaces a reload banner to apply the extension. On a freshly
    // booted cluster that banner can be slow or transient, so hard-requiring it (as the 2.12+ path
    // used to, via `extensionReloadBanner().should('be.visible')`) flaked the whole suite - it was the
    // top failure in a 4-run flake gate (2.12/2.13). Click it only if present; the extension is picked
    // up by the subsequent full-page cy.visit() navigations regardless. This is exactly the tolerant
    // path the 2.10/2.11 branch has always used without flaking - now applied to every version.
    cy.get('body', LONG_TIMEOUT_OPT).then(($body) => {
      if ($body.find('[data-testid="extension-reload-banner-reload-btn"]').length) {
        extensionsPo.extensionReloadClick();
      }
    });

    // A reload (if it happened) can leave the URL on #available, so switch to the Installed tab
    // explicitly rather than waiting for a reload-driven navigation.
    extensionsPo.extensionTabInstalledClick();

    // Deterministic test data - recreate from scratch each run
    cy.deleteRancherResource('v1', 'services', `${ NS }/${ svcName }`, false);
    cy.deleteRancherResource('v1', 'pods', `${ NS }/${ podName }`, false);
    cy.deleteRancherResource('v1', 'secrets', `${ NS }/${ secretName }`, false);
    cy.deleteRancherResource('v1', 'configmaps', `${ NS }/${ cmName }`, false);

    cy.createService(NS, svcName);
    cy.createSecret(NS, secretName);
    cy.createConfigMap(NS, cmName);

    const podBlueprint: any = structuredClone(createPodBlueprint);

    podBlueprint.metadata.name = podName;
    podBlueprint.metadata.namespace = NS;
    cy.createRancherResource('v1', 'pods', JSON.stringify(podBlueprint));
    cy.waitForRancherResource('v1', 'pods', `${ NS }/${ podName }`, (resp: any) => resp.status === 200);

    cy.then(() => {
      setupComplete = true;
    });
  };

  beforeEach(() => {
    if (setupComplete) {
      loginCompat();
    } else {
      runSetup();
    }
  });

  /**
   * Navigate into the elemental extension product and click one of its side-nav sub-entries.
   * Loading the product root first ensures the product nav is registered before we click.
   */
  const navToElementalEntry = (label: string) => {
    cy.visit(`/c/${ CLUSTER_ID }/elemental`);
    cy.get('.side-nav', LONG_TIMEOUT_OPT).should('exist');
    cy.get('.side-nav').contains('a', label, LONG_TIMEOUT_OPT).click();
  };

  /**
   * Click an extension-injected tab by its registered name and assert the demo content in its
   * (now active/visible) panel. The tab button is `btn-<name>` (or `tab-<name>` for RKE2) and the
   * content section has `id="<name>"`. Scoping to the panel avoids matching the same
   * "THIS IS A DEMO TAB" text in other (hidden) demo-tab panels.
   */
  const clickDemoTabAndAssert = (tabName: string) => {
    // force-click: some tab bars (e.g. RKE2 cluster create) clip overflowing tabs, so the tab can
    // exist but report as not visible. The section assertion below confirms it actually activated.
    cy.get(`[data-testid="btn-${ tabName }"], [data-testid="tab-${ tabName }"]`, LONG_TIMEOUT_OPT)
      .should('exist')
      .scrollIntoView()
      .click({ force: true });
    // New dashboard: tab panels carry data-testid="tab-panel-<name>"; old dashboard: <section id="<name>">.
    cy.get(`[data-testid="tab-panel-${ tabName }"], section#${ tabName }`, MEDIUM_TIMEOUT_OPT).should('be.visible').and('contain', 'THIS IS A DEMO TAB');
  };

  /**
   * Open a table row's action menu, self-healing against the occasional click that doesn't open the
   * dropdown on a janky runner (the first action button click can be swallowed during a re-render).
   */
  const openRowActionMenu = (table: SortableTablePo, idx = 0) => {
    const actionBtn = () => table.rowElements().eq(idx).find('[data-testid*="action-button"]');

    actionBtn().scrollIntoView().click();
    cy.get('body').then(($b) => {
      if (!$b.find('[dropdown-menu-collection]:visible').length) {
        actionBtn().click();
      }
    });
    cy.get('[dropdown-menu-collection]:visible', MEDIUM_TIMEOUT_OPT).should('exist');

    const actionMenu = table.rowActionMenu();

    // The dropdown container appears before its items do. Without these waits a click can land on a
    // menu that is still rendering and be silently dropped. Same waits `rowActionMenuOpen` does for
    // by-name lookups (see sortable-table.po.ts).
    actionMenu.checkNoActionsAvailable(false);
    actionMenu.atLeastOneActiveMenuItem();

    return actionMenu;
  };

  /** Navigate to the Apps > Repositories list and return its (string-backed) table */
  const goToReposTable = (): SortableTablePo => {
    const repos = new ChartRepositoriesPagePo(CLUSTER_ID, 'apps');

    repos.goTo(CLUSTER_ID, 'apps');
    repos.waitForPage();

    const table = new SortableTablePo(REPO_LIST);

    table.noRowsShouldNotExist();
    table.checkLoadingIndicatorNotVisible();

    return table;
  };

  // ── Test Group 1: ActionLocation.HEADER ──

  describe('Test Group 1: ActionLocation.HEADER', () => {
    qase(50499, it('1.1 Header Action Button 1 (click + CMD+M shortcut)', () => {
      cy.visit('/home');
      cy.window().then((win) => cy.spy(win.console, 'log').as('consoleLog'));

      // click
      cy.getId('extension-header-action-action-one').should('exist').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 1/);

      // keyboard shortcut
      cy.get('@consoleLog').then((spy: any) => spy.resetHistory());
      cy.get('body').type(`${ MOD_KEY }m`);
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 1/);
    }));

    qase(50500, it('1.2 Header Action Button 2 (click + CMD+B shortcut)', () => {
      cy.visit(`/c/${ CLUSTER_ID }/explorer`);
      cy.window().then((win) => cy.spy(win.console, 'log').as('consoleLog'));

      // click
      cy.getId('extension-header-action-action-two').should('exist').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 2/);

      // keyboard shortcut
      cy.get('@consoleLog').then((spy: any) => spy.resetHistory());
      cy.get('body').type(`${ MOD_KEY }b`);
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 2/);
    }));
  });

  // ── Test Group 2: Tab Extension Points ──

  describe('Test Group 2: Tab Extension Points', () => {
    const conditionalIt = skipTabDetailPage ? it.skip : it;

    qase(50501, conditionalIt('2.1 Tab RESOURCE_DETAIL_PAGE', () => {
      // Visit the service detail (view) page directly - clicking the name link can land on edit.
      cy.visit(`/c/${ CLUSTER_ID }/explorer/service/${ NS }/${ svcName }`);
      clickDemoTabAndAssert('detail-page-id');
    }));

    qase(50502, conditionalIt('2.2 Tab RESOURCE_CREATE_PAGE', () => {
      const services = new ServicesPagePo(CLUSTER_ID);

      services.goTo();
      services.waitForPage();
      services.clickCreate();

      cy.contains('Cluster IP', MEDIUM_TIMEOUT_OPT).click();
      clickDemoTabAndAssert('create-page-id');
    }));

    qase(50503, conditionalIt('2.3 Tab RESOURCE_EDIT_PAGE', () => {
      // Visit the edit page directly, as 2.1 and 2.6 do for the detail page. Reaching it from the
      // list via the row action does not work on Rancher 2.15, where a resource's detailLocation
      // resolves to a route that does not exist (see `noRowNameAssert`). The tab is what this test
      // asserts, and 4.3 still covers "Edit Config" from a list.
      cy.visit(`/c/${ CLUSTER_ID }/explorer/service/${ NS }/${ svcName }?mode=edit`);
      clickDemoTabAndAssert('edit-page-id');
    }));

    qase(50504, conditionalIt('2.4 Tab RESOURCE_SHOW_CONFIGURATION', () => {
      cy.visit(`/c/${ CLUSTER_ID }/explorer/service/${ NS }/${ svcName }`);
      cy.contains('Show Configuration', MEDIUM_TIMEOUT_OPT).click();
      clickDemoTabAndAssert('show-configuration-id');
    }));

    qase(50505, (skipClusterRke2 ? it.skip : it)('2.5 Tab CLUSTER_CREATE_RKE2', () => {
      cy.visit(`/c/${ CLUSTER_ID }/manager/provisioning.cattle.io.cluster/create?type=custom#basic`);
      // Wait for the RKE2 config form's tab bar to render before looking for the extension tab.
      cy.get('[data-testid="tabbed"], .tabbed', LONG_TIMEOUT_OPT).should('exist');
      clickDemoTabAndAssert('cluster-create-rke2-id');
    }));

    // Version conditional: the legacy RESOURCE_DETAIL TabLocation is the one extension point that
    // differs between the tested versions. It is native to 2.14 (skip_resource_detail_legacy=false)
    // and skipped on 2.15/latest (skip_resource_detail_legacy=true) per the test spec's
    // "legacy - up until rancher v2.14.0" note. All other tests run identically on both versions.
    qase(50506, (skipResourceDetailLegacy ? it.skip : it)('2.6 Tab RESOURCE_DETAIL (legacy, up to v2.14)', () => {
      // Visit the pod detail page directly (as 2.1 does for services). Navigating via the pods list
      // raced the post-filter table re-render: the row-link click was intermittently swallowed, so we
      // never left the list and the extension's detail tab never rendered ("btn-pod-detail-id" not
      // found). Direct navigation removes that race - the tab is still what the test asserts.
      cy.visit(`/c/${ CLUSTER_ID }/explorer/pod/${ NS }/${ podName }`);
      clickDemoTabAndAssert('pod-detail-id');
    }));
  });

  // ── Test Group 3: ActionLocation.TABLE ──

  describe('Test Group 3: ActionLocation.TABLE', () => {
    qase(50507, (OLD_ACTION_MENU ? it.skip : it)('3.1 Table Action (row actions, non-bulkable + bulkable)', () => {
      const table = goToReposTable();

      cy.window().then((win) => cy.spy(win.console, 'log').as('consoleLog'));

      // "Demo table action" - scoped to the open row action menu (avoids the hidden bulk button)
      openRowActionMenu(table).getMenuItem('Demo table action').click({ force: true });
      cy.get('@consoleLog').should('be.calledWithMatch', /table action executed 1/);

      // "Demo bulkable action" as a row action
      openRowActionMenu(table).getMenuItem('Demo bulkable action').click({ force: true });
      cy.get('@consoleLog').should('be.calledWithMatch', /table action executed 2/);
    }));

    qase(50508, it('3.2 Table Action (bulkable, via selection + bulk bar)', () => {
      // Wide viewport so the bulk action button renders inline (it collapses into a dropdown otherwise)
      cy.viewport(1920, 1080);

      const table = goToReposTable();

      cy.window().then((win) => cy.spy(win.console, 'log').as('consoleLog'));

      new CheckboxInputPo(table.row(0).column(0)).check();
      new CheckboxInputPo(table.row(1).column(0)).check();

      table.bulkActionButton('Demo bulkable action').should('be.visible').and('not.be.disabled').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /table action executed 2/);
    }));
  });

  // ── Test Group 4: PanelLocation Extension Points ──

  describe('Test Group 4: PanelLocation Extension Points', () => {
    qase(50509, it('4.1 PanelLocation.RESOURCE_LIST', () => {
      goToReposTable();
      cy.contains('Just a sample banner to show that we can render anything here', LONG_TIMEOUT_OPT).should('be.visible');

      // Second RESOURCE_LIST panel, stacked under the banner: an extension-bundled component whose
      // setup() calls useRoute(). Hosts before 2.12 never set `window.__vueRouter`, which vue-router
      // used to be externalised to, so this is where the compat stub's fallback gets exercised
      // (rancher/dashboard#18635). Asserted here rather than in group 9 because this page and panel
      // are already proven to render on every version in the matrix, including 2.10.
      cy.get('[data-testid="extension-use-route-probe"]', MEDIUM_TIMEOUT_OPT).should('contain', 'USE ROUTE OK');
    }));

    qase(50510, it('4.2 PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (details)', () => {
      const table = goToReposTable();

      table.row(0).self().find('a')
        .first()
        .click();
      cy.contains('This is a generic masthead component example', MEDIUM_TIMEOUT_OPT).should('be.visible');
      cy.contains('This is an example on DetailTop').should('be.visible');
    }));

    qase(50511, (OLD_ACTION_MENU ? it.skip : it)('4.3 PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (edit)', () => {
      const table = goToReposTable();

      openRowActionMenu(table).getMenuItem('Edit Config').click({ force: true });
      cy.contains('This is a generic masthead component example', MEDIUM_TIMEOUT_OPT).should('be.visible');
      cy.contains('This is another component example for masthead details - edit view').should('be.visible');
    }));

    qase(50512, (skipAboutTop ? it.skip : it)('4.4 PanelLocation.ABOUT_TOP', () => {
      cy.visit('/about');
      cy.contains('Just a sample banner to show that we can render anything here', LONG_TIMEOUT_OPT).should('be.visible');
    }));
  });

  // ── Test Group 5: CLUSTER_DASHBOARD_CARD ──

  describe('Test Group 5: CLUSTER_DASHBOARD_CARD', () => {
    qase(50513, it('5.1 Dashboard Card', () => {
      cy.visit(`/c/${ CLUSTER_ID }/explorer`);
      cy.contains('Demo card title 1', LONG_TIMEOUT_OPT).should('be.visible');
    }));
  });

  // ── Test Group 6: Table Hook & Table Columns ──

  describe('Test Group 6: Table Hook & Table Columns', () => {
    qase(50514, (skipTableHook ? it.skip : it)('6.1 Table Hook (load, filter, sort)', () => {
      // The extension's table hook logs via console.error (see elemental index.ts).
      // The spy must be attached before the table renders so the initial hook call is captured.
      cy.visit(`/c/${ CLUSTER_ID }/explorer/pod`, {
        onBeforeLoad: (win) => {
          cy.spy(win.console, 'error').as('consoleError');
        }
      });

      const table = new SortableTablePo(STANDARD_LIST);

      table.checkLoadingIndicatorNotVisible();
      table.filter(podName);
      assertFilteredRow(table, podName);

      // on initial load
      cy.get('@consoleError').should('be.calledWithMatch', /TABLE HOOK TRIGGERED/);

      // on filter
      cy.get('@consoleError').then((spy: any) => spy.resetHistory());
      table.resetFilter();
      table.filter(podName);
      cy.get('@consoleError').should('be.calledWithMatch', /TABLE HOOK TRIGGERED/);

      // on sort
      cy.get('@consoleError').then((spy: any) => spy.resetHistory());
      table.self().find('thead tr th').contains('Name').click();
      cy.get('@consoleError').should('be.calledWithMatch', /TABLE HOOK TRIGGERED/);
    }));

    qase(50515, it('6.2 Add Table Column 1 - Custom Formatter', () => {
      const secrets = new SecretsListPagePo(CLUSTER_ID);

      secrets.goTo();
      secrets.waitForPage();

      const table = new SortableTablePo(STANDARD_LIST);

      table.checkLoadingIndicatorNotVisible();
      table.filter(secretName);
      assertFilteredRow(table, secretName);

      cy.contains('Extension Col - Example 1', MEDIUM_TIMEOUT_OPT).should('be.visible');
      cy.contains('Formatter: Custom Cell Value 1').should('be.visible');
    }));

    qase(50516, it('6.3 Add Table Column 2 - Pagination', () => {
      const configMaps = new ConfigMapListPagePo(CLUSTER_ID);

      configMaps.goTo();
      configMaps.waitForPage();

      const table = new SortableTablePo(STANDARD_LIST);

      table.checkLoadingIndicatorNotVisible();
      table.filter(cmName);
      table.rowElementWithName(cmName).should('be.visible');

      cy.contains('Extension Col - Example 2', MEDIUM_TIMEOUT_OPT).should('be.visible');
    }));
  });

  // ── Test Group 7: Shell API Tests ──

  describe('Test Group 7: Shell API Tests', () => {
    const conditionalIt = skipShellApi ? it.skip : it;

    qase(50517, conditionalIt('7.1 Slide-in API', () => {
      navToElementalEntry('shell-api-demo');
      cy.contains('Test Slide-in API', MEDIUM_TIMEOUT_OPT).click();
      cy.contains('Hello from SlideIn panel!').should('be.visible');
    }));

    qase(50518, conditionalIt('7.2 Modal API', () => {
      navToElementalEntry('shell-api-demo');
      cy.contains('Test Modal API', MEDIUM_TIMEOUT_OPT).click();
      cy.contains('Sample general title').should('be.visible');
      cy.contains('Cancel').should('be.visible');
      cy.contains('Add').should('be.visible');
    }));

    qase(50519, conditionalIt('7.3 Notification API', () => {
      navToElementalEntry('shell-api-demo');
      cy.contains('Test Notification API', MEDIUM_TIMEOUT_OPT).click();
      cy.contains('Some notification title').should('be.visible');
      cy.contains('Hello world! Success!').should('be.visible');
    }));

    qase(50520, conditionalIt('7.4 System API', () => {
      navToElementalEntry('shell-api-demo');
      cy.contains('Test System API', MEDIUM_TIMEOUT_OPT).click();
      cy.contains('gitCommit').should('be.visible');
      cy.contains('isDevBuild').should('be.visible');
      cy.contains('isPrereleaseVersion').should('be.visible');
      cy.contains('isRancherPrime').should('be.visible');
      cy.contains('kubernetesVersion').should('be.visible');
      cy.contains('rancherVersion').should('be.visible');
    }));
  });

  // ── Test Group 8: Elemental Extension Tests ──

  describe('Test Group 8: Elemental Extension Tests', () => {
    qase(50521, it('8.1 Elemental Extension Setup', () => {
      navToElementalEntry('Dashboard');
      cy.contains('Install Elemental Operator', MEDIUM_TIMEOUT_OPT).click();
      cy.contains('button', 'Next').click();
      cy.contains('button', 'Install').click();

      // Wait for the helm install to complete (operator install pulls a chart - allow plenty of time)
      cy.contains('SUCCESS: helm upgrade', { timeout: 240000 }).should('exist');

      // Close the terminal and verify the dashboard renders
      cy.get('.closer').click();
      navToElementalEntry('Dashboard');
      cy.contains('OS Management Dashboard', LONG_TIMEOUT_OPT).should('be.visible');
    }));

    // Version conditional: on the older dashboard runtimes (2.12 / 2.13) the machineregistration
    // create form renders with a different (tabbed) layout, so the standard name + save create flow
    // doesn't navigate to the resource. The create-via-YAML path (8.3) still covers create there.
    qase(50522, (LEGACY_DASHBOARD ? it.skip : it)('8.2 Elemental EDIT/CREATE Interface', () => {
      navToElementalEntry('Registration Endpoint');
      // Exact match so we don't accidentally hit "Create from YAML"
      cy.contains(/^Create$/, MEDIUM_TIMEOUT_OPT).click();

      // Stable testids work across versions: NameNsDescription's name input and CruResource's
      // save button ('form' is the default componentTestid). A text-based "Create" button match
      // can hit the wrong button (e.g. on 2.14), leaving the resource uncreated.
      cy.get('[data-testid="NameNsDescriptionNameInput"], [data-testid="name-ns-description-name"] input', MEDIUM_TIMEOUT_OPT)
        .first()
        .clear()
        .type('demo-reg-endpoint-1');
      cy.getId('form-save').click();

      // Created resource detail page. The extension's custom detail view doesn't render the name
      // as text on all versions (2.14 shows the registration URL only), so confirm via the URL.
      cy.url(LONG_TIMEOUT_OPT).should('include', 'demo-reg-endpoint-1');

      // Name is reliably visible as a row in the list view
      navToElementalEntry('Registration Endpoint');
      cy.contains('demo-reg-endpoint-1', LONG_TIMEOUT_OPT).should('be.visible');
    }));

    qase(50523, it('8.3 Elemental EDIT/CREATE YAML Interface', () => {
      navToElementalEntry('Inventory of Machines');
      cy.contains('Create from YAML', MEDIUM_TIMEOUT_OPT).click();

      const codeMirror = CodeMirrorPo.first(LONG_TIMEOUT_OPT);

      codeMirror.value().then((value: string) => codeMirror.set(value.replace('#string', 'demo-mach-inv-1')));

      cy.contains('button', 'Create').click();
      cy.contains('demo-mach-inv-1', LONG_TIMEOUT_OPT).should('be.visible');
    }));
  });

  // ── Test Group 9: Cross-version host/shell contract ──

  /**
   * Regression cover for three bugs that only appear when an extension built against *this*
   * branch's `@rancher/shell` is loaded into an older Rancher. In each case the code that runs is
   * the copy of shell bundled into the extension, not the host's own - which is why the normal e2e
   * run cannot see them and only this matrix can.
   *
   * - #18633 Models reach the extension manager through the Vuex root state. Hosts before 2.14 set
   *   only `rootState.$plugin`, so `resource-class.js` -> `this.$extension.getPlugins()` threw as
   *   soon as anything read a model's `detailLocation`. Fixed by the root-state half of the compat
   *   shim in `shell/pkg/auto-import.js`, which also covers `steve-class.js` -> `modelExtensions`
   *   and the extension validator lookup in `resource-class.js`.
   * - #18634 `ResourceList/Masthead.vue` reads the manager in `data()`, which runs before that shim
   *   can possibly have run, so a cold load of an extension list route white-screened. Fixed by the
   *   optional-chained guard at the call site.
   * - #18635 is covered by test 4.1 (the `useRoute` probe panel) and, for the `ActionMenuShell`
   *   consumer specifically, by 9.3 below.
   *
   * These need a list page owned by the *extension* - elemental's own `ResourceList` page - with at
   * least one row, so the group depends on the operator installed by 8.1 and the machine inventory
   * created by 8.3, and runs last.
   */
  describe('Test Group 9: Cross-version host/shell contract', () => {
    const MACHINE_INV_TYPE = 'elemental.cattle.io.machineinventory';
    // Created by 8.3, which runs on every version in the matrix.
    const MACHINE_INV_NAME = 'demo-mach-inv-1';
    // Must be the real cluster id, not the `_` placeholder: on hosts before 2.14 the `c/_` form
    // renders the product chrome but never resolves a cluster to list against, so the table comes
    // back permanently empty while the nav count still reports the row. Group 8 reaches this same
    // list through the side nav, which is why it only bites here.
    const MACHINE_INV_LIST_URL = `/elemental/c/${ CLUSTER_ID }/${ MACHINE_INV_TYPE }`;

    /**
     * Full page load straight onto the extension's list route - the "hard refresh" case - with a
     * console.error spy in place before the app boots. Vue reports errors thrown in `data()`,
     * `setup()` and computed properties through console.error rather than letting them reach
     * Cypress' uncaught:exception handler, so that spy is how these TypeErrors surface.
     */
    const coldLoadExtensionList = () => cy.visit(MACHINE_INV_LIST_URL, {
      onBeforeLoad: (win) => {
        cy.spy(win.console, 'error').as('consoleError');
      }
    });

    const expectNoConsoleError = (pattern: RegExp) => {
      cy.get('@consoleError').then((spy: any) => {
        const matched = spy.getCalls()
          .flatMap((call: any) => call.args)
          .map((arg: any) => (arg instanceof Error ? `${ arg.message } ${ arg.stack }` : String(arg)))
          .filter((text: string) => pattern.test(text));

        expect(matched, `console.error entries matching ${ pattern }`).to.have.length(0);
      });
    };

    /** The extension's own list, settled and showing the machine inventory row */
    const extensionList = (): SortableTablePo => {
      const table = new SortableTablePo(STANDARD_LIST);

      table.checkLoadingIndicatorNotVisible();
      table.rowElementWithName(MACHINE_INV_NAME, LONG_TIMEOUT_OPT, true).should('be.visible');

      return table;
    };

    it('9.1 Extension model reaches the extension manager through the root state', () => {
      coldLoadExtensionList();

      const table = extensionList();

      // `LinkDetail` only renders an <a> when `row.detailLocation` resolves. When the getter behind
      // it threw, the cell fell back to plain text and every row link was dead.
      table.detailsPageLinkWithName(MACHINE_INV_NAME, undefined, true)
        .should('have.attr', 'href')
        .and('match', new RegExp(`/elemental/c/[^/]+/${ MACHINE_INV_TYPE.replace(/\./g, '\\.') }/[^/]+/${ MACHINE_INV_NAME }$`));

      // The extension's other two routes to the manager, surfaced as columns by the test extension.
      // `modelExtensions` throws when the manager is missing; the validator lookup is optional
      // chained and so fails silently - which is exactly why it needs asserting rather than
      // relying on an error.
      const row = () => table.rowWithName(MACHINE_INV_NAME, true).self();

      row().should('contain', 'MODEL EXTENSION OK');
      row().should('contain', 'PLUGIN VALIDATOR OK');

      expectNoConsoleError(/getPlugins|getDynamic/);
    });

    it('9.2 Extension list route renders on a cold load (hard refresh)', () => {
      coldLoadExtensionList();

      // Masthead, create button and table all come from the extension's bundled ResourceList. If
      // Masthead's data() throws, none of them render and the route is a blank page.
      cy.get('header.with-subheader .title h1', LONG_TIMEOUT_OPT).should('be.visible').and('not.be.empty');
      cy.contains('Create from YAML', MEDIUM_TIMEOUT_OPT).should('be.visible');
      extensionList();

      expectNoConsoleError(/getPlugins/);

      // Contrast: the in-app path is the one that always worked. Asserting it after the cold load
      // keeps a failure above attributable to the refresh rather than to a missing route or schema.
      navToElementalEntry('Inventory of Machines');
      cy.get('header.with-subheader .title h1', LONG_TIMEOUT_OPT).should('be.visible');
    });

    (skipExtRowActionMenu ? it.skip : it)('9.3 Row action menu renders on an extension list', () => {
      coldLoadExtensionList();

      const table = extensionList();

      // The 3-dot button is `ActionMenuShell`. When `useRoute()` threw in its `setup()` the component
      // never mounted, so the whole column was missing rather than merely misbehaving.
      openRowActionMenu(table).self().find('[dropdown-menu-item]').should('have.length.greaterThan', 0);

      expectNoConsoleError(/useRoute|__vueRouter/);
    });
  });

  // ── Test Group 10: Resources API (Rancher 2.15+) ──

  /**
   * The Resources API (`$resources`, provided by `@shell/apis`) arrived in Rancher 2.15, so this
   * whole group is gated off below that - see `skip_resources_api` in the workflow matrix.
   *
   * The extension's demo page drives the API and writes a single result string per probe, so each
   * assertion here is just "click the probe, read the outcome". Keeping the API calls in the
   * extension (rather than in `cy.window()` pokes) means they run through the extension's own
   * bundle, which is the thing the compatibility matrix exists to exercise.
   */
  describe('Test Group 10: Resources API', () => {
    const conditionalIt = skipResourcesApi ? it.skip : it;

    /** Click a probe button and assert the single-line result it writes back. */
    const runProbe = (id: string, expected: string) => {
      cy.get(`[data-testid="resources-api-${ id }"]`, MEDIUM_TIMEOUT_OPT).scrollIntoView().click();
      cy.get('[data-testid="resources-api-result"]', MEDIUM_TIMEOUT_OPT).should('contain', expected);
    };

    conditionalIt('10.1 Resources API is provided to the extension', () => {
      navToElementalEntry('Resources API Demo');

      // The page reports MISSING ON SUPPORTED HOST when the host version says 2.15+ but no
      // `$resources` was injected - that wording distinguishes a regression from a version gap.
      cy.get('[data-testid="resources-api-availability"]', LONG_TIMEOUT_OPT)
        .should('be.visible')
        .and('contain', 'RESOURCES API AVAILABLE');
    });

    conditionalIt('10.2 ClusterApi reads (find, findAll, findFiltered)', () => {
      navToElementalEntry('Resources API Demo');

      runProbe('cluster-find', `CLUSTER FIND OK: ${ cmName }`);
      runProbe('cluster-find-all', 'CLUSTER FINDALL OK: true');
      runProbe('cluster-find-all-opts', 'CLUSTER FINDALL OPTS OK: true');
      // Transient paging returns a page object rather than an array; assert the prefix only, since
      // the page length depends on how many pods the host happens to be running.
      runProbe('cluster-find-filtered-transient', 'CLUSTER FINDFILTERED TRANSIENT OK:');
      runProbe('cluster-find-filtered-page', 'CLUSTER FINDFILTERED PAGE OK: true');
      runProbe('cluster-find-filtered-label', 'CLUSTER FINDFILTERED LABEL OK: true');
    });

    conditionalIt('10.3 ClusterApi writes (create, update, replace, delete)', () => {
      navToElementalEntry('Resources API Demo');

      // Ordered on purpose - update/replace/delete all act on the configmap that create makes.
      runProbe('cluster-create', 'CLUSTER CREATE OK:');
      runProbe('cluster-update', 'CLUSTER UPDATE OK: v2');
      runProbe('cluster-replace', 'CLUSTER REPLACE OK: v3');
      runProbe('cluster-delete', 'CLUSTER DELETE OK: true');
    });

    conditionalIt('10.4 MgmtApi reads (find, findAll, findFiltered)', () => {
      navToElementalEntry('Resources API Demo');

      runProbe('mgmt-find', 'MGMT FIND OK: server-url');
      runProbe('mgmt-find-all', 'MGMT FINDALL OK: true');
      runProbe('mgmt-find-filtered-transient', 'MGMT FINDFILTERED TRANSIENT OK:');
      runProbe('mgmt-find-filtered-page', 'MGMT FINDFILTERED PAGE OK: true');
      runProbe('mgmt-find-filtered-label', 'MGMT FINDFILTERED LABEL OK: true');
    });

    conditionalIt('10.5 Full CRUD lifecycles (cluster + management scoped)', () => {
      navToElementalEntry('Resources API Demo');

      // Each of these runs create -> update -> replace -> delete behind one click, so a pass means
      // the whole lifecycle round-tripped against the host.
      runProbe('cluster-crud', 'CLUSTER CRUD OK: v3');
      runProbe('mgmt-crud', 'MGMT CRUD OK: v3');
    });
  });

  // ── Test Group 11: Product Registration API (Rancher 2.15+) ──

  /**
   * The Product Registration API (`addProduct` / `extendProduct`) arrived in Rancher 2.15, so this
   * whole group is gated off below that - see `skip_product_registration` in the workflow matrix.
   *
   * Product names are normalised by stripping dashes (`BasePluginProduct.normalizeProductName`),
   * and new top-level products default to `startRouteWithProduct: true`, so `elemental-compat`
   * routes as `/elementalcompat/c/_/<page>`. Page names keep their dashes. Entry into each product
   * is by URL; everything after that is driven through the side nav, the way a user would.
   */
  describe('Test Group 11: Product Registration API', () => {
    const conditionalIt = skipProductRegistration ? it.skip : it;

    const COMPAT_PRODUCT_URL = '/elementalcompat/c/_/compat-overview';

    /** Assert the probe page currently rendered is the one for `marker`. Exact match: several
     * markers are prefixes of each other (e.g. "COMPAT GROUP DEFAULT" vs "... SIBLING"). */
    const expectProdRegPage = (marker: string) => {
      cy.get('[data-testid="prod-reg-probe"]', MEDIUM_TIMEOUT_OPT)
        .should('be.visible')
        .invoke('text')
        .should('eq', `PRODREG PAGE OK: ${ marker }`);
    };

    /**
     * Click a side-nav entry by its exact label.
     *
     * Matching the label element rather than the anchor, because the nav renders three shapes and
     * only one of them is an anchor whose own text is the label (see `nav/Type.vue`, `nav/Group.vue`):
     * - a leaf is `<a class="type-link">` wrapping `<span class="label">`, but a resource count is
     *   appended *inside* that same anchor, so the anchor's text is e.g. "Compat Clusters1"
     * - a group with an overview page is `<a><h6><span>`
     * - a group without one is a plain `<h6><span>` with a click handler and no anchor at all
     * The click bubbles to whichever handler owns the entry, so one selector drives all three.
     */
    const clickNav = (label: string) => {
      cy.get('.side-nav', LONG_TIMEOUT_OPT).should('exist');
      cy.get('.side-nav')
        .contains('.label, .header h6 span', new RegExp(`^\\s*${ label }\\s*$`), MEDIUM_TIMEOUT_OPT)
        .click();
    };

    conditionalIt('11.1 New top-level product: landing page, nav tree and enable gating', () => {
      cy.visit(COMPAT_PRODUCT_URL);

      // The landing route is the highest-weighted child, which is the custom overview page.
      expectProdRegPage('COMPAT OVERVIEW');

      cy.get('.side-nav', LONG_TIMEOUT_OPT).should('exist');
      ['Compat Overview', 'Compat Clusters', 'Compat Group Plain', 'Compat Group Overview', 'Compat Group Default', 'Compat Gated Visible']
        .forEach((label) => cy.get('.side-nav').should('contain', label));

      // `enable: { ifHaveType: 'elemental.compat.does.not.exist' }` can never hold, so this entry
      // must not render at all - that is the gating, not just a disabled link.
      cy.get('.side-nav').should('not.contain', 'Compat Gated Hidden');
    });

    conditionalIt('11.2 Resource page renders with its custom list config', () => {
      cy.visit(COMPAT_PRODUCT_URL);
      // Settle on the landing page first - clicking the nav while the product is still registering
      // its routes lands back on the overview.
      expectProdRegPage('COMPAT OVERVIEW');
      clickNav('Compat Clusters');

      const table = new SortableTablePo(STANDARD_LIST);

      table.checkLoadingIndicatorNotVisible();
      // provisioning.cattle.io.cluster always has exactly the `local` row on the test host, so the
      // single row is the right row on hosts that blank the Name column too (see `noRowNameAssert`).
      assertFilteredRow(table, 'local');

      // `listConfig.localHeaders` replaced the default columns, so the custom one must be present.
      cy.contains('ProdReg Probe', MEDIUM_TIMEOUT_OPT).should('be.visible');
      (noRowNameAssert ? table.rowElements().first() : table.rowWithName('local', true).self())
        .should('contain', 'PRODREG COLUMN OK');
    });

    conditionalIt('11.3 Groups: plain children, overview group, explicit default child', () => {
      cy.visit(COMPAT_PRODUCT_URL);
      expectProdRegPage('COMPAT OVERVIEW');

      // Group WITHOUT a component - the header is not a route of its own, clicking it expands the
      // group and lands on the first child.
      clickNav('Compat Group Plain');
      expectProdRegPage('COMPAT CHILD A');
      clickNav('Compat Child B');
      expectProdRegPage('COMPAT CHILD B');

      // Group WITH a component + enableOverviewPage - the header itself is a route.
      clickNav('Compat Group Overview');
      expectProdRegPage('COMPAT GROUP OVERVIEW');

      // Group with sideMenu.default - the header opens the named child, not the first one.
      clickNav('Compat Group Default');
      expectProdRegPage('COMPAT GROUP DEFAULT');
    });

    conditionalIt('11.4 Gated page, single-page product and name-only product', () => {
      cy.visit(COMPAT_PRODUCT_URL);
      expectProdRegPage('COMPAT OVERVIEW');

      // `enable: { ifHaveType: 'provisioning.cattle.io.cluster' }` holds on the test host.
      clickNav('Compat Gated Visible');
      expectProdRegPage('COMPAT GATED VISIBLE');

      // Single-page product: `component` on the metadata, no side menu, route is the product name.
      cy.visit('/elementalcompatsingle');
      expectProdRegPage('COMPAT SINGLE PAGE');

      // Name-only overload: addProduct('elemental-compat-minimal') registers the product and its
      // route resolves, but with no component and no child pages there is no page to render and
      // no nav to build - the host falls back to its own placeholder. Assert the product chrome
      // rather than a side nav, which only exists once a product has something to put in it.
      cy.visit('/elementalcompatminimal/c/_/main');
      cy.get('header', LONG_TIMEOUT_OPT).should('contain', 'elemental-compat-minimal');
    });

    conditionalIt('11.5 Extending built-in products (explorer + manager)', () => {
      // extendProduct generates `c/:cluster/<product>/<page>` routes against the host's own
      // product, so these pages appear in the built-in side nav rather than a new one.
      cy.visit(`/c/${ CLUSTER_ID }/explorer`);
      clickNav('Elemental Compat Explorer Page');
      expectProdRegPage('EXTEND EXPLORER OK');

      cy.visit(`/c/${ CLUSTER_ID }/manager`);
      clickNav('Elemental Compat Manager Page');
      expectProdRegPage('EXTEND MANAGER OK');
    });
  });

  after(() => {
    // Best-effort cleanup. If setup never completed (e.g. the cluster never became login-ready)
    // there is nothing to clean up, and attempting to log in here would just fail the after-all
    // hook on top of the real failure. The Docker container is torn down after the job regardless.
    if (!moduleName) {
      return;
    }

    loginCompat();

    // Clean up test data
    cy.deleteRancherResource('v1', 'services', `${ NS }/${ svcName }`, false);
    cy.deleteRancherResource('v1', 'pods', `${ NS }/${ podName }`, false);
    cy.deleteRancherResource('v1', 'secrets', `${ NS }/${ secretName }`, false);
    cy.deleteRancherResource('v1', 'configmaps', `${ NS }/${ cmName }`, false);

    // Disable developer features and remove the developer-loaded extension
    cy.setUserPreference({ 'plugin-developer': false });
    cy.request({
      method:           'DELETE',
      url:              `/v1/catalog.cattle.io.uiplugins/cattle-ui-plugin-system/${ moduleName }`,
      failOnStatusCode: false,
    });
  });
});
