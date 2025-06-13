import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { LoggingClusteroutputEditPagePo, LoggingClusteroutputListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusteroutput.po';
import { LoggingClusterflowEditPagePo, LoggingClusterflowListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusterflow-po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import ChartInstalledAppsListPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_APPS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

describe('Logging Chart', { testIsolation: 'off', tags: ['@charts', '@adminUser'] }, () => {
  const kubectl = new Kubectl();
  const chartApp = 'rancher-logging';
  const chartCrd = 'rancher-logging-crd';
  const chartNamespace = 'cattle-logging-system';

  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('is installed and a rule created', () => {
    cy.updateNamespaceFilter('local', 'none', '{"local":[]}');
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();
    const sideNav = new ProductNavPo();
    const outputName = Cypress._.uniqueId(Date.now().toString());
    const flowName = Cypress._.uniqueId(Date.now().toString());
    const loggingOutputList = new LoggingClusteroutputListPagePo();
    const loggingOutputEdit = new LoggingClusteroutputEditPagePo();
    const loggingFlowList = new LoggingClusterflowListPagePo();
    const loggingFlowEdit = new LoggingClusterflowEditPagePo();

    ChartPage.navTo(null, 'Logging');
    chartPage.waitForChartHeader('Logging', { timeout: 20000 });
    chartPage.goToInstall();
    installChartPage.nextPage();

    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
    installChartPage.installChart();
    cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
    kubectl.waitForTerminalStatus('Disconnected');

    kubectl.closeTerminal();

    sideNav.navToSideMenuGroupByLabel('Logging');
    sideNav.navToSideMenuGroupByLabel('ClusterOutput');
    loggingOutputList.createLoggingOutput();
    loggingOutputEdit.waitForPage();
    loggingOutputEdit.nameNsDescription().name().set(outputName);
    loggingOutputEdit.target().set('random.domain.site');
    loggingOutputEdit.saveCreateForm().click();
    loggingOutputList.waitForPage();
    loggingOutputList.listElementWithName(outputName).should('exist');

    sideNav.navToSideMenuEntryByLabel('ClusterFlow');
    loggingFlowList.createLoggingFlow();
    loggingFlowEdit.waitForPage();
    loggingFlowEdit.nameNsDescription().name().set(flowName);
    loggingFlowEdit.outputsTab();
    loggingFlowEdit.outputSelector().toggle();
    loggingFlowEdit.outputSelector().clickOptionWithLabel(outputName);
    loggingFlowEdit.saveCreateForm().click();
    loggingFlowList.waitForPage();
    loggingFlowList.listElementWithName(flowName).should('exist');
    loggingFlowList.rowLinkWithName(flowName).click();
    const loggingFlowEditExisting = new LoggingClusterflowEditPagePo('local', flowName);

    loggingFlowEditExisting.ruleItem(0).should('be.visible');
  });

  // testing https://github.com/rancher/dashboard/issues/4849
  it('can uninstall both chart and crd at once', () => {
    cy.intercept('GET', `${ CLUSTER_APPS_BASE_URL }?*`).as('getCharts');

    const clusterTools = new ClusterToolsPagePo('local');
    const installedAppsPage = new ChartInstalledAppsListPagePo('local', 'apps');

    installedAppsPage.goTo();
    installedAppsPage.waitForPage();
    cy.wait('@getCharts', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    installedAppsPage.appsList().sortableTable().checkLoadingIndicatorNotVisible();
    installedAppsPage.appsList().sortableTable().noRowsShouldNotExist();
    installedAppsPage.appsList().resourceTableDetails(chartApp, 1).should('exist');
    installedAppsPage.appsList().resourceTableDetails(chartCrd, 1).should('exist');

    clusterTools.goTo();
    clusterTools.waitForPage();
    cy.wait('@getCharts', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    clusterTools.deleteChart(chartApp);

    const promptRemove = new PromptRemove();

    cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/cattle-logging-system/rancher-logging?action=uninstall`).as('chartUninstall');
    cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/cattle-logging-system/rancher-logging-crd?action=uninstall`).as('crdUninstall');
    promptRemove.checkbox().shouldContainText('Delete the CRD associated with this app');

    promptRemove.checkbox().set();
    promptRemove.checkbox().isChecked();
    promptRemove.remove();
    cy.wait('@chartUninstall').its('response.statusCode').should('eq', 201);
    cy.wait('@crdUninstall').its('response.statusCode').should('eq', 201);

    kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
    kubectl.closeTerminalByTabName('Uninstall cattle-logging-system:rancher-logging');
    kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
    kubectl.closeTerminalByTabName('Uninstall cattle-logging-system:rancher-logging-crd');

    installedAppsPage.goTo();
    installedAppsPage.waitForPage();
    cy.wait('@getCharts', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
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
