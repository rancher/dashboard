import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { LoggingClusterOutputCreateEditPagePo, LoggingClusteroutputListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusteroutput.po';
import { LoggingClusterFlowCreateEditPagePo, LoggingClusterFlowDetailPagePo, LoggingClusterFlowListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusterflow.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import ChartInstalledAppsListPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT, VERY_LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_APPS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import CardPo from '@/cypress/e2e/po/components/card.po';
import { runTestWhenChartAvailable } from '@/cypress/support/commands/rancher-api-commands';

describe('Logging Chart', { testIsolation: false, tags: ['@charts', '@adminUser'] }, () => {
  const kubectl = new Kubectl();
  const chartAppDisplayName = 'Logging';
  const chartApp = 'rancher-logging';
  const chartCrd = 'rancher-logging-crd';
  const chartNamespace = 'cattle-logging-system';
  const loggingFlowList = new LoggingClusterFlowListPagePo();
  const loggingFlowCreate = new LoggingClusterFlowCreateEditPagePo('local');
  let flowName: string;
  let outputName: string;

  // The state of an app in the logging namespace: 'absent', 'error', or its state name (e.g. 'deployed').
  const appState = (name: string): Cypress.Chainable<string> => cy.request({
    url:              `${ Cypress.env('api') }/v1/catalog.cattle.io.apps/${ chartNamespace }/${ name }`,
    headers:          { Accept: 'application/json' },
    failOnStatusCode: false
  }).then((resp) => {
    if (resp.status !== 200) {
      return 'absent';
    }

    const state = resp.body?.metadata?.state;

    return state?.error ? 'error' : state?.name || 'unknown';
  });

  // Uninstall the chart and its CRD app, and wait for both to be gone. A no-op when neither is installed.
  const uninstallLogging = () => {
    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}', false);
    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}', false);
    cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartApp }`, (resp: any) => resp?.status === 404, 30, { failOnStatusCode: false });
    // Wait for the CRD app to be gone too: installing while its uninstall is still running leaves the
    // CRD app Failed, and the chart then never deploys.
    cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartCrd }`, (resp: any) => resp?.status === 404, 60, { failOnStatusCode: false });
  };

  // Make sure both apps are installed and deployed. When they are not (missing, failed, or half removed),
  // start from neither and install the CRD chart, then the chart, at the newest compatible version: the
  // chart needs its CRD app at the same version.
  const ensureLoggingInstalled = () => {
    appState(chartApp).then((app) => {
      appState(chartCrd).then((crd) => {
        if (app === 'deployed' && crd === 'deployed') {
          return;
        }

        uninstallLogging();
        cy.getChartVersions('rancher-charts', chartApp).then((versions: string[]) => {
          cy.installChart('rancher-charts', chartCrd, chartCrd, versions[0], chartNamespace);
          cy.waitForResourceState('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartCrd }`, 'deployed', 150)
            .should('eq', true);
          cy.installChart('rancher-charts', chartApp, chartAppDisplayName, versions[0], chartNamespace);
          cy.waitForResourceState('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartApp }`, 'deployed', 150)
            .should('eq', true);
        });
      });
    });
  };

  before(() => {
    cy.login();
    cy.updateNamespaceFilter('local', 'none', '{"local":[]}', { delay: true });
    cy.setUserPreference({ 'show-pre-release': true }, true); // Show pre-release versions so charts with only -rc versions appear on Charts page
    cy.setUserPreference({ 'all-namespaces': true }, true);

    HomePagePo.goTo();

    cy.createE2EResourceName('logging-flow').then((name) => {
      flowName = name;
    });

    cy.createE2EResourceName('logging-output').then((name) => {
      outputName = name;
    });
  });

  describe.skip('Install', () => {
    // Each attempt starts with neither app installed (testIsolation is off): a failed earlier attempt can
    // leave the chart partially installed, so the Install button is no longer shown and the install
    // request never fires on retry.
    beforeEach(function() {
      runTestWhenChartAvailable('rancher-charts', chartApp, this, uninstallLogging);
    });

    it('is installed and a rule created', function() {
      runTestWhenChartAvailable('rancher-charts', 'rancher-logging', this, () => {
        const installChartPage = new InstallChartPage();
        const chartPage = new ChartPage();
        const loggingOutputList = new LoggingClusteroutputListPagePo();
        const loggingOutputEdit = new LoggingClusterOutputCreateEditPagePo('local');

        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
        ChartPage.navTo(null, 'Logging');
        chartPage.waitForChartHeader('Logging', { timeout: 20000 });
        chartPage.waitForPage();
        chartPage.goToInstall();
        installChartPage.nextPage();
        installChartPage.installChart();

        cy.wait('@chartInstall', { timeout: 10000 }).its('response.statusCode').should('eq', 201);
        kubectl.waitForTerminalStatus('Disconnected');
        kubectl.closeTerminal();

        // The install POST returns before the chart is usable: Helm finishes deploying and the logging
        // operator establishes its CRDs asynchronously. Wait for the app to be deployed AND for the
        // ClusterOutput type to actually be served before navigating to it - otherwise the logging nav
        // entry is missing (attempt 1 failure) and creating a ClusterOutput 404s because the type is not
        // registered yet (attempt 2 failure).
        // The deploy (helm operation pods, then the operator) has been seen to take well over the 60
        // retries this used to allow, so give it longer.
        cy.waitForResourceState('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartApp }`, 'deployed', 150);

        // Wait for the logging types at the URLs the list pages actually load them from - the cluster's
        // schemas. The top-level /v1 collection can answer 200 while the cluster schemas do not have the
        // type yet, and the list page then renders blank (no Create button, no list request at all).
        const waitForServed = (url: string, retries = 60): void => {
          cy.request({ url: `${ Cypress.env('api') }${ url }`, failOnStatusCode: false }).then((resp) => {
            if (resp.status === 200 || retries === 0) {
              return;
            }
            cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
            waitForServed(url, retries - 1);
          });
        };

        waitForServed('/v1/logging.banzaicloud.io.clusteroutputs');
        waitForServed('/k8s/clusters/local/v1/schemas/logging.banzaicloud.io.clusteroutput');
        waitForServed('/k8s/clusters/local/v1/schemas/logging.banzaicloud.io.clusterflow');

        // The by-id GET can answer 200 for a new resource while the collection the list page reads still
        // omits it - the reloaded list then shows "There are no rows to show". Wait until the collection
        // itself includes the resource. Logs instead of asserting on exhaustion; the row check fails then.
        const waitForInCollection = (type: string, name: string, retries = 30): void => {
          cy.request({
            url:              `${ Cypress.env('api') }/v1/${ type }?pagesize=100000`,
            headers:          { Accept: 'application/json' },
            failOnStatusCode: false
          }).then((resp) => {
            const ids: string[] = (resp.body?.data || []).map((r: any) => r.id);

            if (ids.includes(`${ chartNamespace }/${ name }`)) {
              return;
            }
            if (retries === 0) {
              cy.log(`${ type } collection still does not include ${ name }`);

              return;
            }
            cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
            waitForInCollection(type, name, retries - 1);
          });
        };

        // Known issue rancher/dashboard#18381: the ClusterOutput and ClusterFlow lists can render "There are
        // no rows to show" while the API already serves the new resource. Give the list a bounded number of
        // checks and reloads to show the row; the row assertion after each call still fails the test if it
        // never does.
        const waitForListed = (name: string, reloads = 2, checks = 15): void => {
          cy.get('body').then(($body) => {
            if ($body.find('tbody tr').filter((_, row) => (row.textContent || '').includes(name)).length > 0) {
              return;
            }

            if (checks > 0) {
              cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
              waitForListed(name, reloads, checks - 1);
            } else if (reloads > 0) {
              cy.reload();
              waitForListed(name, reloads - 1);
            }
          });
        };

        // Go straight to the ClusterOutput list rather than clicking through the product side-nav.
        // The nav is built from the schemas loaded when the cluster was entered, so the CRD this
        // install just registered is served by the API (the wait above) while the nav still has no
        // entry for it - the entry then never appears. Even once it does, the nav lookup queries the
        // menu twice and can lose the entry between the two queries. A direct visit loads the schema
        // set that includes the logging types and does not depend on the menu at all.
        loggingOutputList.goTo();
        loggingOutputList.waitForPage();
        // Visiting directly means the page is still loading when we arrive, and this list has been seen
        // to take longer than the default timeout to render. Wait for the Create button itself with the
        // long timeout. (checkLoadingIndicatorNotVisible has a fixed 10s, and the table page object ignores
        // timeouts, so neither can be lengthened.)
        loggingOutputList.baseResourceList().masthead().createButton(LONG_TIMEOUT_OPT).should('be.visible');
        loggingOutputList.baseResourceList().masthead().create();
        loggingOutputEdit.waitForPage();
        loggingOutputEdit.resourceDetail().createEditView().nameNsDescription().name()
          .set(outputName);
        loggingOutputEdit.target().set('random.domain.site');
        loggingOutputEdit.resourceDetail().createEditView().saveAndWaitForRequests('POST', '/v1/logging.banzaicloud.io.clusteroutputs')
          .then(({ response }) => {
            expect(response?.statusCode).to.eq(201);
            expect(response?.body.metadata).to.have.property('name', outputName);
          });
        loggingOutputList.waitForPage();
        // The create POST returns before the new ClusterOutput is indexed, so confirm it at the API
        // first. Even then the list can read "There are no rows to show" while the API already serves the
        // resource. That matches the list-blanking behaviour on master tracked in rancher/dashboard#18381:
        // fetching a single resource by id invalidates the paginated list's page, so the list empties
        // itself until something re-fetches it. Reload so the page is fetched fresh.
        cy.waitForRancherResource('v1', 'logging.banzaicloud.io.clusteroutputs', `cattle-logging-system/${ outputName }`, (resp: any) => resp?.status === 200, 20, { failOnStatusCode: false });
        waitForInCollection('logging.banzaicloud.io.clusteroutputs', outputName);
        cy.reload();
        loggingOutputList.waitForPage();
        loggingOutputList.list().self(LONG_TIMEOUT_OPT).find('tbody', LONG_TIMEOUT_OPT).should('exist');
        waitForListed(outputName);
        loggingOutputList.baseResourceList().resourceTable().sortableTable().rowElementWithName(outputName, MEDIUM_TIMEOUT_OPT)
          .should('exist');

        // Visit the ClusterFlow list directly, for the same reason as the ClusterOutput list above:
        // this entry is rendered from a schema registered by the install, and the menu lookup queries
        // the nav twice, so it can lose the entry between the two queries.
        loggingFlowList.goTo();
        loggingFlowList.waitForPage();
        // As for the ClusterOutput list above: wait for Create itself, with a timeout that applies.
        loggingFlowList.baseResourceList().masthead().createButton(LONG_TIMEOUT_OPT).should('be.visible');
        loggingFlowList.baseResourceList().masthead().create();
        loggingFlowCreate.waitForPage();
        loggingFlowCreate.resourceDetail().createEditView()
          .nameNsDescription().name()
          .set(flowName);
        loggingFlowCreate.resourceDetail().tabs().clickTabWithSelector('[data-testid="btn-outputs"]');
        loggingFlowCreate.waitForPage(undefined, 'outputs');
        loggingFlowCreate.outputSelector().toggle();
        loggingFlowCreate.outputSelector().clickOptionWithLabel(outputName);

        // Configure namespaces during creation
        // testing https://github.com/rancher/dashboard/issues/13845
        loggingFlowCreate.resourceDetail().tabs().clickTabWithSelector('[data-testid="btn-match"]');
        loggingFlowCreate.waitForPage(undefined, 'match');
        const namespaces = ['fleet-default', 'cattle-system'];

        loggingFlowCreate.setNamespaceValueByLabel(0, namespaces);
        loggingFlowCreate.resourceDetail().createEditView().saveAndWaitForRequests('POST', '/v1/logging.banzaicloud.io.clusterflows')
          .then(({ response }) => {
            expect(response?.statusCode).to.eq(201);
            expect(response?.body.metadata).to.have.property('name', flowName);
            expect(response?.body.spec.match[0].select.namespaces[0]).to.contain(namespaces[0]);
            expect(response?.body.spec.match[0].select.namespaces[1]).to.equal(namespaces[1]);
          });
        loggingFlowList.waitForPage();
        // The create POST returns before the new ClusterFlow is indexed and served to the list, so
        // reading the row straight away can miss it. Confirm it exists at the API level first, then
        // allow the row lookup the medium timeout for the list to catch up.
        cy.waitForRancherResource('v1', 'logging.banzaicloud.io.clusterflows', `cattle-logging-system/${ flowName }`, (resp: any) => resp?.status === 200, 20, { failOnStatusCode: false });
        waitForInCollection('logging.banzaicloud.io.clusterflows', flowName);
        // Same as the ClusterOutput list above (rancher/dashboard#18381): the list can empty itself after
        // the create even once the API serves the resource, so reload before reading the row.
        cy.reload();
        loggingFlowList.waitForPage();
        loggingFlowList.list().self(LONG_TIMEOUT_OPT).find('tbody', LONG_TIMEOUT_OPT).should('exist');
        waitForListed(flowName);
        loggingFlowList.list().resourceTable().sortableTable().rowElementWithName(flowName, MEDIUM_TIMEOUT_OPT)
          .should('exist');

        // Open the flow's detail page directly by URL.
        const loggingFlowDetail = new LoggingClusterFlowDetailPagePo('local', 'cattle-logging-system', flowName);

        loggingFlowDetail.goTo();
        loggingFlowDetail.waitForPage();
        loggingFlowDetail.ruleItem(0).should('be.visible');
      });
    });
  });

  describe('Uninstall', () => {
    // Each attempt starts with both apps installed and deployed, so the test always uninstalls both. They
    // are installed by the test above; a retry (after an attempt that already uninstalled them) or a run
    // where that test did not leave them deployed installs them through the API.
    beforeEach(function() {
      runTestWhenChartAvailable('rancher-charts', chartApp, this, ensureLoggingInstalled);
    });

    // testing https://github.com/rancher/dashboard/issues/4849
    it('can uninstall both chart and crd at once', function() {
      runTestWhenChartAvailable('rancher-charts', chartApp, this, () => {
        // Show ALL namespaces (including system) before listing the installed apps: the logging
        // charts live in the system namespace cattle-logging-system, and the preceding test can
        // leave the filter scoped to a namespace that hides them. 'all' is the All-Namespaces
        // selection - an empty selection can resolve to user-namespaces-only and hide them.
        cy.updateNamespaceFilter('local', 'none', '{"local":["all"]}', { delay: true });

        cy.intercept('GET', `${ CLUSTER_APPS_BASE_URL }?*`).as('getCharts');

        const clusterTools = new ClusterToolsPagePo('local');
        const installedAppsPage = new ChartInstalledAppsListPagePo('local', 'apps');

        installedAppsPage.goTo();
        installedAppsPage.waitForPage();

        // Known issue rancher/dashboard#18558: the installed-apps list intermittently finishes loading
        // empty (renders tr.no-rows) even though the apps are installed and returned by the getCharts
        // fetch; the app should render the installed apps without needing a fresh navigation. This e2e
        // test depends on that fix - the re-navigate retry below is the workaround until it lands.
        //
        // Waiting for the loading indicator to clear FIRST is what lets us tell "the apps never
        // rendered" apart from "still loading" - only once loading is done does tr.no-rows mean a
        // genuinely empty render. If it came up empty, re-navigate to force a fresh fetch/render and
        // retry. Re-navigating - unlike a page reload - does not abort an in-flight request.
        const waitForInstalledApps = (attempt = 0): void => {
          installedAppsPage.appsList().checkVisible(MEDIUM_TIMEOUT_OPT);
          installedAppsPage.appsList().sortableTable().checkLoadingIndicatorNotVisible();
          cy.get('body').then(($body) => {
            if ($body.find('tr.no-rows').length > 0 && attempt < 5) {
              installedAppsPage.goTo();
              installedAppsPage.waitForPage();
              waitForInstalledApps(attempt + 1);
            }
          });
        };

        waitForInstalledApps();

        // Both apps are listed before the uninstall.
        installedAppsPage.appNameCell(chartApp, MEDIUM_TIMEOUT_OPT).should('exist');
        installedAppsPage.appNameCell(chartCrd, MEDIUM_TIMEOUT_OPT).should('exist');

        // Uninstall the chart from Cluster Tools, with "Delete the CRD associated with this app" ticked, so
        // both apps are removed in one go.
        clusterTools.goTo();
        clusterTools.waitForPage();
        cy.wait('@getCharts', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
        clusterTools.deleteChart(chartAppDisplayName);

        const promptRemove = new PromptRemove();
        const card = new CardPo();

        cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/${ chartNamespace }/${ chartApp }?action=uninstall`).as('chartUninstall');
        cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/${ chartNamespace }/${ chartCrd }?action=uninstall`).as('crdUninstall');
        promptRemove.checkbox().shouldContainText('Delete the CRD associated with this app');
        promptRemove.checkbox().set();
        promptRemove.checkbox().isChecked();
        promptRemove.remove();

        card.checkNotExists(MEDIUM_TIMEOUT_OPT);
        cy.wait('@chartUninstall').its('response.statusCode').should('eq', 201);
        kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
        kubectl.closeTerminalByTabName(`Uninstall ${ chartNamespace }:${ chartApp }`);
        cy.wait('@crdUninstall').its('response.statusCode').should('eq', 201);
        kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
        kubectl.closeTerminalByTabName(`Uninstall ${ chartNamespace }:${ chartCrd }`);

        // Both apps leave the installed-apps list. The rows go as soon as Rancher has removed the apps,
        // without a reload; the uninstall (Helm, then the CRD and finalizer cleanup) can take minutes, so
        // allow a generous timeout. The name match is exact, so the CRD app's row cannot stand in for the
        // chart's (or the other way round).
        installedAppsPage.goTo();
        installedAppsPage.waitForPage();
        installedAppsPage.appsList().checkVisible(MEDIUM_TIMEOUT_OPT);
        installedAppsPage.appNameCell(chartApp, VERY_LONG_TIMEOUT_OPT).should('not.exist');
        installedAppsPage.appNameCell(chartCrd, VERY_LONG_TIMEOUT_OPT).should('not.exist');

        // Confirm at the API too: an installed-apps list that came up empty (see above) must not pass for
        // a successful uninstall.
        cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartApp }`, (resp: any) => resp?.status === 404, 30, { failOnStatusCode: false })
          .should('eq', true);
        cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartCrd }`, (resp: any) => resp?.status === 404, 30, { failOnStatusCode: false })
          .should('eq', true);
      });
    });
  });

  after('clean up', () => {
    cy.setUserPreference({ 'all-namespaces': false }, true);
    cy.setUserPreference({ 'show-pre-release': false });
    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}', false);
    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}', false);
    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
