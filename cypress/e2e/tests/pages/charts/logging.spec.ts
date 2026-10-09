import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { LoggingClusterOutputCreateEditPagePo, LoggingClusteroutputListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusteroutput.po';
import { LoggingClusterFlowCreateEditPagePo, LoggingClusterFlowDetailPagePo, LoggingClusterFlowListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusterflow.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import ChartInstalledAppsListPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
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

  it('is installed and a rule created', function() {
    runTestWhenChartAvailable('rancher-charts', 'rancher-logging', this, () => {
      const installChartPage = new InstallChartPage();
      const chartPage = new ChartPage();
      const loggingOutputList = new LoggingClusteroutputListPagePo();
      const loggingOutputEdit = new LoggingClusterOutputCreateEditPagePo('local');

      // Make each attempt independent (testIsolation is off): a failed earlier attempt can leave
      // the chart partially installed, so the Install button is no longer shown and the install
      // request never fires on retry. Uninstall any leftover and wait for it to clear so a retry
      // starts from a clean slate (a no-op on a clean first attempt - the GET is a 404 straight away).
      cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}', false);
      cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}', false);
      cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartApp }`, (resp: any) => resp?.status === 404, 30, { failOnStatusCode: false });
      // Wait for the CRD app to be gone too: installing while its uninstall is still running leaves the
      // CRD app Failed, and the chart then never deploys on any later attempt.
      cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartCrd }`, (resp: any) => resp?.status === 404, 60, { failOnStatusCode: false });

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

  // testing https://github.com/rancher/dashboard/issues/4849
  it('can uninstall both chart and crd at once', function() {
    runTestWhenChartAvailable('rancher-charts', 'rancher-logging', this, () => {
      // Show ALL namespaces (including system) before listing the installed apps: the logging
      // charts live in the system namespace cattle-logging-system, and the preceding test can
      // leave the filter scoped to a namespace that hides them. 'all' is the All-Namespaces
      // selection - an empty selection can resolve to user-namespaces-only and hide them.
      cy.updateNamespaceFilter('local', 'none', '{"local":["all"]}', { delay: true });

      cy.intercept('GET', `${ CLUSTER_APPS_BASE_URL }?*`).as('getCharts');

      const clusterTools = new ClusterToolsPagePo('local');
      const installedAppsPage = new ChartInstalledAppsListPagePo('local', 'apps');

      // Confirm the chart is actually installed AND settled (deployed) at the API level first.
      // This separates "the install did not persist / is still deploying" from "installed but the
      // list did not render it", and avoids racing a still-transitioning app that the list omits.
      cy.waitForResourceState('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartApp }`, 'deployed');

      installedAppsPage.goTo();
      installedAppsPage.waitForPage();

      // Known issue rancher/dashboard#18558: the installed-apps list intermittently finishes loading
      // empty (renders tr.no-rows) even though the app is installed and returned by the getCharts
      // fetch; the app should render the installed apps without needing a fresh navigation. This e2e
      // test depends on that fix - the re-navigate retry below is the workaround until it lands.
      //
      // The installed-apps list intermittently finishes loading empty (the tr.no-rows row) even
      // though the app is installed. Waiting for the loading indicator to clear FIRST is what lets
      // us tell "the app never rendered" apart from "still loading" - only once loading is done does
      // tr.no-rows mean a genuinely empty render. If it came up empty, re-navigate to force a fresh
      // fetch/render and retry. Re-navigating - unlike a page reload - does not abort an in-flight
      // request.
      const waitForInstalledLoggingApp = (attempt = 0): void => {
        installedAppsPage.appsList().checkVisible(MEDIUM_TIMEOUT_OPT);
        installedAppsPage.appsList().sortableTable().checkLoadingIndicatorNotVisible();
        cy.get('body').then(($body) => {
          if ($body.find('tr.no-rows').length > 0 && attempt < 5) {
            installedAppsPage.goTo();
            installedAppsPage.waitForPage();
            waitForInstalledLoggingApp(attempt + 1);
          }
        });
      };

      waitForInstalledLoggingApp();

      // Loading has finished and the list rendered rows.
      installedAppsPage.appsList().sortableTable().noRowsShouldNotExist();
      // Known issue rancher/dashboard#18844: uninstalling an app together with its CRD errors the
      // prompt with "apps.catalog.cattle.io '<crd>' not found" when the CRD app is already gone.
      // Deleting a missing CRD should be idempotent (already-deleted -> succeed), not error. This e2e
      // test depends on that fix; the API-state-driven uninstall below is the workaround until it lands.
      //
      // Drive the uninstall from the ACTUAL app state via the API, not the rendered list: the list
      // can still show an app the backend has already removed, and uninstalling that app then 404s
      // and errors the prompt (the "... not found" case in the video). This also keeps the test
      // retry-independent - a previous attempt may have removed the chart, the CRD, or both.
      const appExists = (name: string) => cy.request({
        url:              `${ Cypress.env('api') }${ CLUSTER_APPS_BASE_URL }/${ chartNamespace }/${ name }`,
        failOnStatusCode: false
      }).then((resp) => resp.status === 200);

      appExists(chartApp).then((hasChart) => {
        if (!hasChart) {
          // The chart is already uninstalled (e.g. by a previous attempt) - this test's goal is met.
          cy.log('rancher-logging is already uninstalled; nothing to uninstall.');

          return;
        }

        appExists(chartCrd).then((hasCrd) => {
          // Verify the installed rows are displayed for whatever is actually present.
          installedAppsPage.appsList().resourceTableDetails(chartApp, 1).should('exist');
          if (hasCrd) {
            installedAppsPage.appsList().resourceTableDetails(chartCrd, 1).should('exist');
          }

          clusterTools.goTo();
          clusterTools.waitForPage();
          cy.wait('@getCharts', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
          clusterTools.deleteChart(chartAppDisplayName);

          const promptRemove = new PromptRemove();
          const card = new CardPo();

          cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/${ chartNamespace }/${ chartApp }?action=uninstall`).as('chartUninstall');
          promptRemove.checkbox().shouldContainText('Delete the CRD associated with this app');

          if (hasCrd) {
            // Both present - uninstall the chart together with its CRD (the scenario this test covers).
            cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/${ chartNamespace }/${ chartCrd }?action=uninstall`).as('crdUninstall');
            promptRemove.checkbox().set();
            promptRemove.checkbox().isChecked();
          }
          // else: the CRD app is already gone - leave "Delete the CRD" unchecked, otherwise the
          // uninstall would 404 on the missing CRD and error the prompt; just remove the chart.

          promptRemove.remove();

          card.checkNotExists(MEDIUM_TIMEOUT_OPT);
          cy.wait('@chartUninstall').its('response.statusCode').should('eq', 201);
          kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
          kubectl.closeTerminalByTabName('Uninstall cattle-logging-system:rancher-logging');

          if (hasCrd) {
            cy.wait('@crdUninstall').its('response.statusCode').should('eq', 201);
            kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
            kubectl.closeTerminalByTabName('Uninstall cattle-logging-system:rancher-logging-crd');
          }
        });
      });

      // Wait for the chart app itself to be gone, by its exact id. This used to wait for a list row
      // matching /rancher-logging/ to disappear, but that also matches rancher-logging-crd, so a CRD
      // app left behind (seen in Failed state) kept the check failing for its whole 700s timeout. The
      // uninstall (Helm + CRD/finalizer cleanup) can take minutes, so allow a generous budget.
      cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartApp }`, (resp: any) => resp?.status === 404, 300, { failOnStatusCode: false })
        .should('eq', true);
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
