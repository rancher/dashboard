import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { LoggingClusteroutputEditPagePo, LoggingClusteroutputListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusteroutput.po';
import { LoggingClusterflowEditPagePo, LoggingClusterflowListPagePo } from '@/cypress/e2e/po/other-products/logging/logging-clusterflow-po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';

describe('Logging Chart', { testIsolation: 'off', tags: ['@charts', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  it('is installed and a rule created', () => {
    cy.updateNamespaceFilter('local', 'none', '{"local":[]}');
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();
    const sideNav = new ProductNavPo();
    const kubectl = new Kubectl();
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
    cy.contains('Disconnected');

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

  after('clean up', () => {
    const chartNamespace = 'cattle-logging-system';
    const chartApp = 'rancher-logging';
    const chartCrd = 'rancher-logging-crd';

    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}');
    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}');
    cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
  });
});
