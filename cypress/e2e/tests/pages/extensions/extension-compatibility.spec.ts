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

// Cypress coerces numeric-looking CYPRESS_* values (e.g. "2.13") to numbers, so stringify it.
const RANCHER_VERSION = String(Cypress.env('rancher_version') ?? '');

// Older dashboard runtimes (2.10-2.13) differ from current in two spots that need an `if`:
//  - the login flow doesn't drive the POST /v1-public/login that cy.login() waits on
//  - the elemental machineregistration create form renders with a different (tabbed) layout
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
 * Log in, tolerating Rancher version differences in the login flow.
 *
 * On the older dashboards (2.11 / 2.12 / 2.13, in this curl-bootstrapped setup) login doesn't drive
 * the POST /v1-public/login that the shared cy.login() waits on, so cy.login() times out even though
 * auth succeeds. There we submit the login form and validate by reaching an authenticated page
 * instead. All other versions use the standard cy.login() unchanged.
 */
const loginCompat = () => {
  if (!LEGACY_DASHBOARD) {
    cy.login();

    return;
  }

  const username = Cypress.env('username');
  const password = Cypress.env('password');

  cy.session(['compat', username, password], () => {
    const loginPage = new LoginPagePo();

    LoginPagePo.goTo();
    loginPage.switchToLocal();
    loginPage.username().set(username);
    loginPage.password().set(password);
    loginPage.submit();
    // Validate by leaving the login page. 2.13 posts to a different endpoint than the one
    // cy.login() waits on, so a successful login is detected by navigating away from /auth/login.
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

describe('Extension Compatibility', { tags: ['@extensions', '@adminUser'], retries: { runMode: 3, openMode: 0 } }, () => {
  // One-time suite setup (developer-load the extension + create test data). This runs from
  // beforeEach guarded by `setupComplete` rather than a `before` hook: a `before all` hook is
  // never retried, so a single fresh-cluster flake (slow login / side-nav) would fail the whole
  // job. A guarded beforeEach is covered by Cypress test retries. The dev-load is persisted in the
  // cluster and the resources are delete-then-create, so re-running on a retry is safe.
  let setupComplete = false;

  const runSetup = () => {
    loginCompat();

    // Discover extension details from the locally-served catalog (serve-pkgs output)
    cy.request(`${ EXTENSION_SERVER_URL }/`).then((resp) => {
      const ext = resp.body[0];

      moduleName = `${ ext.name }-${ ext.version }`;
      extensionUrl = `${ EXTENSION_SERVER_URL }/${ moduleName }/${ ext.main }`;
    });

    // Enable extension developer features
    cy.setUserPreference({ 'plugin-developer': true });

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

    // Developer-load the extension
    const extensionsPo = new ExtensionsPagePo();

    extensionsPo.goTo();
    // Long timeout - the uiplugins page can take a while to render right after boot.
    cy.get('[data-testid="extensions-page-title"]', { timeout: 120000 }).should('contain', 'Extensions');
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
    // Content lives in `section#<name>` (the tab nav `<li>` shares the same id, so scope to section).
    cy.get(`section#${ tabName }`, MEDIUM_TIMEOUT_OPT).should('be.visible').and('contain', 'THIS IS A DEMO TAB');
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

    return table.rowActionMenu();
  };

  /** Navigate to the Services list, filter to the test service and return its (string-backed) table */
  const goToServicesList = (): SortableTablePo => {
    const services = new ServicesPagePo(CLUSTER_ID);

    services.goTo();
    services.waitForPage();

    const table = new SortableTablePo(STANDARD_LIST);

    table.checkLoadingIndicatorNotVisible();
    table.filter(svcName);
    table.rowElementWithName(svcName).should('be.visible');

    return table;
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
    it('1.1 Header Action Button 1 (click + CMD+M shortcut)', () => {
      cy.visit('/home');
      cy.window().then((win) => cy.spy(win.console, 'log').as('consoleLog'));

      // click
      cy.getId('extension-header-action-action-one').should('exist').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 1/);

      // keyboard shortcut
      cy.get('@consoleLog').then((spy: any) => spy.resetHistory());
      cy.get('body').type(`${ MOD_KEY }m`);
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 1/);
    });

    it('1.2 Header Action Button 2 (click + CMD+B shortcut)', () => {
      cy.visit(`/c/${ CLUSTER_ID }/explorer`);
      cy.window().then((win) => cy.spy(win.console, 'log').as('consoleLog'));

      // click
      cy.getId('extension-header-action-action-two').should('exist').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 2/);

      // keyboard shortcut
      cy.get('@consoleLog').then((spy: any) => spy.resetHistory());
      cy.get('body').type(`${ MOD_KEY }b`);
      cy.get('@consoleLog').should('be.calledWithMatch', /action executed 2/);
    });
  });

  // ── Test Group 2: Tab Extension Points ──

  describe('Test Group 2: Tab Extension Points', () => {
    const conditionalIt = skipTabDetailPage ? it.skip : it;

    conditionalIt('2.1 Tab RESOURCE_DETAIL_PAGE', () => {
      // Visit the service detail (view) page directly - clicking the name link can land on edit.
      cy.visit(`/c/${ CLUSTER_ID }/explorer/service/${ NS }/${ svcName }`);
      clickDemoTabAndAssert('detail-page-id');
    });

    conditionalIt('2.2 Tab RESOURCE_CREATE_PAGE', () => {
      const services = new ServicesPagePo(CLUSTER_ID);

      services.goTo();
      services.waitForPage();
      services.clickCreate();

      cy.contains('Cluster IP', MEDIUM_TIMEOUT_OPT).click();
      clickDemoTabAndAssert('create-page-id');
    });

    conditionalIt('2.3 Tab RESOURCE_EDIT_PAGE', () => {
      const table = goToServicesList();

      table.rowActionMenuOpen(svcName).getMenuItem('Edit Config').click();
      clickDemoTabAndAssert('edit-page-id');
    });

    conditionalIt('2.4 Tab RESOURCE_SHOW_CONFIGURATION', () => {
      cy.visit(`/c/${ CLUSTER_ID }/explorer/service/${ NS }/${ svcName }`);
      cy.contains('Show Configuration', MEDIUM_TIMEOUT_OPT).click();
      clickDemoTabAndAssert('show-configuration-id');
    });

    (skipClusterRke2 ? it.skip : it)('2.5 Tab CLUSTER_CREATE_RKE2', () => {
      cy.visit(`/c/${ CLUSTER_ID }/manager/provisioning.cattle.io.cluster/create?type=custom#basic`);
      // Wait for the RKE2 config form's tab bar to render before looking for the extension tab.
      cy.get('[data-testid="tabbed"], .tabbed', LONG_TIMEOUT_OPT).should('exist');
      clickDemoTabAndAssert('cluster-create-rke2-id');
    });

    // Version conditional: the legacy RESOURCE_DETAIL TabLocation is the one extension point that
    // differs between the tested versions. It is native to 2.14 (skip_resource_detail_legacy=false)
    // and skipped on 2.15/latest (skip_resource_detail_legacy=true) per the test spec's
    // "legacy - up until rancher v2.14.0" note. All other tests run identically on both versions.
    (skipResourceDetailLegacy ? it.skip : it)('2.6 Tab RESOURCE_DETAIL (legacy, up to v2.14)', () => {
      // Visit the pod detail page directly (as 2.1 does for services). Navigating via the pods list
      // raced the post-filter table re-render: the row-link click was intermittently swallowed, so we
      // never left the list and the extension's detail tab never rendered ("btn-pod-detail-id" not
      // found). Direct navigation removes that race - the tab is still what the test asserts.
      cy.visit(`/c/${ CLUSTER_ID }/explorer/pod/${ NS }/${ podName }`);
      clickDemoTabAndAssert('pod-detail-id');
    });
  });

  // ── Test Group 3: ActionLocation.TABLE ──

  describe('Test Group 3: ActionLocation.TABLE', () => {
    (OLD_ACTION_MENU ? it.skip : it)('3.1 Table Action (row actions, non-bulkable + bulkable)', () => {
      const table = goToReposTable();

      cy.window().then((win) => cy.spy(win.console, 'log').as('consoleLog'));

      // "Demo table action" - scoped to the open row action menu (avoids the hidden bulk button)
      openRowActionMenu(table).getMenuItem('Demo table action').click({ force: true });
      cy.get('@consoleLog').should('be.calledWithMatch', /table action executed 1/);

      // "Demo bulkable action" as a row action
      openRowActionMenu(table).getMenuItem('Demo bulkable action').click({ force: true });
      cy.get('@consoleLog').should('be.calledWithMatch', /table action executed 2/);
    });

    it('3.2 Table Action (bulkable, via selection + bulk bar)', () => {
      // Wide viewport so the bulk action button renders inline (it collapses into a dropdown otherwise)
      cy.viewport(1920, 1080);

      const table = goToReposTable();

      cy.window().then((win) => cy.spy(win.console, 'log').as('consoleLog'));

      new CheckboxInputPo(table.row(0).column(0)).check();
      new CheckboxInputPo(table.row(1).column(0)).check();

      table.bulkActionButton('Demo bulkable action').should('be.visible').and('not.be.disabled').click();
      cy.get('@consoleLog').should('be.calledWithMatch', /table action executed 2/);
    });
  });

  // ── Test Group 4: PanelLocation Extension Points ──

  describe('Test Group 4: PanelLocation Extension Points', () => {
    it('4.1 PanelLocation.RESOURCE_LIST', () => {
      goToReposTable();
      cy.contains('Just a sample banner to show that we can render anything here', LONG_TIMEOUT_OPT).should('be.visible');
    });

    it('4.2 PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (details)', () => {
      const table = goToReposTable();

      table.row(0).self().find('a')
        .first()
        .click();
      cy.contains('This is a generic masthead component example', MEDIUM_TIMEOUT_OPT).should('be.visible');
      cy.contains('This is an example on DetailTop').should('be.visible');
    });

    (OLD_ACTION_MENU ? it.skip : it)('4.3 PanelLocation.DETAILS_MASTHEAD & DETAILS_TOP (edit)', () => {
      const table = goToReposTable();

      openRowActionMenu(table).getMenuItem('Edit Config').click({ force: true });
      cy.contains('This is a generic masthead component example', MEDIUM_TIMEOUT_OPT).should('be.visible');
      cy.contains('This is another component example for masthead details - edit view').should('be.visible');
    });

    (skipAboutTop ? it.skip : it)('4.4 PanelLocation.ABOUT_TOP', () => {
      cy.visit('/about');
      cy.contains('Just a sample banner to show that we can render anything here', LONG_TIMEOUT_OPT).should('be.visible');
    });
  });

  // ── Test Group 5: CLUSTER_DASHBOARD_CARD ──

  describe('Test Group 5: CLUSTER_DASHBOARD_CARD', () => {
    it('5.1 Dashboard Card', () => {
      cy.visit(`/c/${ CLUSTER_ID }/explorer`);
      cy.contains('Demo card title 1', LONG_TIMEOUT_OPT).should('be.visible');
    });
  });

  // ── Test Group 6: Table Hook & Table Columns ──

  describe('Test Group 6: Table Hook & Table Columns', () => {
    (skipTableHook ? it.skip : it)('6.1 Table Hook (load, filter, sort)', () => {
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
      table.rowElementWithName(podName).should('be.visible');

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
    });

    it('6.2 Add Table Column 1 - Custom Formatter', () => {
      const secrets = new SecretsListPagePo(CLUSTER_ID);

      secrets.goTo();
      secrets.waitForPage();

      const table = new SortableTablePo(STANDARD_LIST);

      table.checkLoadingIndicatorNotVisible();
      table.filter(secretName);
      table.rowElementWithName(secretName).should('be.visible');

      cy.contains('Extension Col - Example 1', MEDIUM_TIMEOUT_OPT).should('be.visible');
      cy.contains('Formatter: Custom Cell Value 1').should('be.visible');
    });

    it('6.3 Add Table Column 2 - Pagination', () => {
      const configMaps = new ConfigMapListPagePo(CLUSTER_ID);

      configMaps.goTo();
      configMaps.waitForPage();

      const table = new SortableTablePo(STANDARD_LIST);

      table.checkLoadingIndicatorNotVisible();
      table.filter(cmName);
      table.rowElementWithName(cmName).should('be.visible');

      cy.contains('Extension Col - Example 2', MEDIUM_TIMEOUT_OPT).should('be.visible');
    });
  });

  // ── Test Group 7: Shell API Tests ──

  describe('Test Group 7: Shell API Tests', () => {
    const conditionalIt = skipShellApi ? it.skip : it;

    conditionalIt('7.1 Slide-in API', () => {
      navToElementalEntry('shell-api-demo');
      cy.contains('Test Slide-in API', MEDIUM_TIMEOUT_OPT).click();
      cy.contains('Hello from SlideIn panel!').should('be.visible');
    });

    conditionalIt('7.2 Modal API', () => {
      navToElementalEntry('shell-api-demo');
      cy.contains('Test Modal API', MEDIUM_TIMEOUT_OPT).click();
      cy.contains('Sample general title').should('be.visible');
      cy.contains('Cancel').should('be.visible');
      cy.contains('Add').should('be.visible');
    });

    conditionalIt('7.3 Notification API', () => {
      navToElementalEntry('shell-api-demo');
      cy.contains('Test Notification API', MEDIUM_TIMEOUT_OPT).click();
      cy.contains('Some notification title').should('be.visible');
      cy.contains('Hello world! Success!').should('be.visible');
    });

    conditionalIt('7.4 System API', () => {
      navToElementalEntry('shell-api-demo');
      cy.contains('Test System API', MEDIUM_TIMEOUT_OPT).click();
      cy.contains('gitCommit').should('be.visible');
      cy.contains('isDevBuild').should('be.visible');
      cy.contains('isPrereleaseVersion').should('be.visible');
      cy.contains('isRancherPrime').should('be.visible');
      cy.contains('kubernetesVersion').should('be.visible');
      cy.contains('rancherVersion').should('be.visible');
    });
  });

  // ── Test Group 8: Elemental Extension Tests ──

  describe('Test Group 8: Elemental Extension Tests', () => {
    it('8.1 Elemental Extension Setup', () => {
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
    });

    // Version conditional: on the older dashboard runtimes (2.12 / 2.13) the machineregistration
    // create form renders with a different (tabbed) layout, so the standard name + save create flow
    // doesn't navigate to the resource. The create-via-YAML path (8.3) still covers create there.
    (LEGACY_DASHBOARD ? it.skip : it)('8.2 Elemental EDIT/CREATE Interface', () => {
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
    });

    it('8.3 Elemental EDIT/CREATE YAML Interface', () => {
      navToElementalEntry('Inventory of Machines');
      cy.contains('Create from YAML', MEDIUM_TIMEOUT_OPT).click();

      cy.get('.CodeMirror', LONG_TIMEOUT_OPT).then(($cm) => {
        const cm = ($cm[0] as any).CodeMirror;

        cm.setValue(cm.getValue().replace('#string', 'demo-mach-inv-1'));
      });

      cy.contains('button', 'Create').click();
      cy.contains('demo-mach-inv-1', LONG_TIMEOUT_OPT).should('be.visible');
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
