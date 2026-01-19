import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { LoggingClusterOutputCreateEditPagePo, LoggingClusteroutputListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusteroutput.po';
import { LoggingClusterFlowCreateEditPagePo, LoggingClusterFlowDetailPagePo, LoggingClusterFlowListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusterflow.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import ChartInstalledAppsListPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_APPS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import CardPo from '~/cypress/e2e/po/components/card.po';

describe('Logging Chart', { testIsolation: 'off', tags: ['@charts', '@adminUser'] }, () => {
  const kubectl = new Kubectl();
  const chartAppDisplayName = 'Logging';
  const chartApp = 'rancher-logging';
  const chartCrd = 'rancher-logging-crd';
  const chartNamespace = 'cattle-logging-system';
  const loggingFlowList = new LoggingClusterFlowListPagePo();
  const loggingFlowCreate = new LoggingClusterFlowCreateEditPagePo('local');
  let flowName;
  let outputName;

  before(() => {
    cy.login();
    HomePagePo.goTo();

    cy.createE2EResourceName('logging-flow').then((name) => {
      flowName = name;
    });

    cy.createE2EResourceName('logging-output').then((name) => {
      outputName = name;
    });
  });

  it('is installed and a rule created', () => {
    cy.updateNamespaceFilter('local', 'none', '{"local":[]}');
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();
    const sideNav = new ProductNavPo();
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

    LoggingClusteroutputListPagePo.navTo();
    loggingOutputList.waitForPage();
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
    loggingOutputList.baseResourceList().resourceTable().sortableTable().rowElementWithName(outputName)
      .should('exist');

    sideNav.navToSideMenuEntryByLabel('ClusterFlow');
    loggingFlowList.baseResourceList().masthead().create();
    loggingFlowCreate.waitForPage();
    loggingFlowCreate.resourceDetail().createEditView()
      .nameNsDescription().name()
      .set(flowName);
    loggingFlowCreate.resourceDetail().tabs().clickTabWithSelector('[data-testid="btn-outputs"]');
    loggingFlowCreate.waitForPage(null, 'outputs');
    loggingFlowCreate.outputSelector().toggle();
    loggingFlowCreate.outputSelector().clickOptionWithLabel(outputName);

    // Configure namespaces during creation
    // testing https://github.com/rancher/dashboard/issues/13845
    loggingFlowCreate.resourceDetail().tabs().clickTabWithSelector('[data-testid="btn-match"]');
    loggingFlowCreate.waitForPage(null, 'match');
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
    loggingFlowList.list().resourceTable().sortableTable().rowElementWithName(flowName)
      .should('exist');
    loggingFlowList.list().resourceTable().goToDetailsPage(flowName);
    const loggingFlowDetail = new LoggingClusterFlowDetailPagePo('local', 'cattle-logging-system', flowName);

    loggingFlowDetail.ruleItem(0).should('be.visible');
  });

  // testing https://github.com/rancher/dashboard/issues/4849
  it('can uninstall both chart and crd at once', () => {
    cy.intercept('GET', `${ CLUSTER_APPS_BASE_URL }?*`).as('getCharts');

    const clusterTools = new ClusterToolsPagePo('local');
    const installedAppsPage = new ChartInstalledAppsListPagePo('local', 'apps');

    installedAppsPage.goTo('local', 'apps');
    installedAppsPage.waitForPage();
    cy.wait('@getCharts', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    installedAppsPage.appsList().checkVisible(MEDIUM_TIMEOUT_OPT);
    installedAppsPage.appsList().sortableTable().checkLoadingIndicatorNotVisible();
    installedAppsPage.appsList().sortableTable().noRowsShouldNotExist();
    installedAppsPage.appsList().resourceTableDetails(chartApp, 1).should('exist');
    installedAppsPage.appsList().resourceTableDetails(chartCrd, 1).should('exist');

    clusterTools.goTo();
    clusterTools.waitForPage();
    cy.wait('@getCharts', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    clusterTools.deleteChart(chartAppDisplayName);

    const promptRemove = new PromptRemove();

    cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/cattle-logging-system/rancher-logging?action=uninstall`).as('chartUninstall');
    cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/cattle-logging-system/rancher-logging-crd?action=uninstall`).as('crdUninstall');
    promptRemove.checkbox().shouldContainText('Delete the CRD associated with this app');

    promptRemove.checkbox().set();
    promptRemove.checkbox().isChecked();
    promptRemove.remove();

    const card = new CardPo();

    card.checkNotExists(MEDIUM_TIMEOUT_OPT);
    cy.wait('@chartUninstall').its('response.statusCode').should('eq', 201);
    cy.wait('@crdUninstall').its('response.statusCode').should('eq', 201);

    kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
    kubectl.closeTerminalByTabName('Uninstall cattle-logging-system:rancher-logging');
    kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
    kubectl.closeTerminalByTabName('Uninstall cattle-logging-system:rancher-logging-crd');

    installedAppsPage.goTo('local', 'apps');
    installedAppsPage.waitForPage();
    cy.wait('@getCharts', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    installedAppsPage.appsList().checkVisible(MEDIUM_TIMEOUT_OPT);
    installedAppsPage.appsList().sortableTable().checkLoadingIndicatorNotVisible();
    installedAppsPage.appsList().sortableTable().noRowsShouldNotExist();
    installedAppsPage.appsList().sortableTable().rowNames('.col-link-detail', MEDIUM_TIMEOUT_OPT)
      .should('not.contain', chartApp);
    // CRD removal may take time to reflect in the UI, so we conditionally wait until it's gone
    installedAppsPage.appsList().sortableTable().waitForListItemRemoval('.col-link-detail', chartCrd, MEDIUM_TIMEOUT_OPT);
  });

  after('clean up', () => {
    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}', false);
    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}', false);
    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
