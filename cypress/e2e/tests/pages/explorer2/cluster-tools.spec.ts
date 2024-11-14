import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
// import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const clusterTools = new ClusterToolsPagePo('local');

describe('Cluster Tools', { tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('can navigate to cluster tools and see all feature charts', () => {
    const clusterDashboard = new ClusterDashboardPagePo('local');

    clusterDashboard.goTo();
    clusterDashboard.waitForPage();
    clusterDashboard.navToSideMenuEntryByLabel('Tools');
    clusterTools.waitForPage();
    clusterTools.featureChartCards().should('have.length.gte', 10);
  });

  it('can deploy chart successfully', () => {
    clusterTools.goTo();
    clusterTools.waitForPage();
    clusterTools.getChartVersion(0).invoke('text').then((el) => {
      const chartVersion = el.trim().slice(1);

      const chartType = 'rancher-alerting-drivers';
      const installAlertingDriversPage = `repo-type=cluster&repo=rancher-charts&chart=${ chartType }&version=${ chartVersion }&tools`;
      const installCharts = new InstallChartPage();

      clusterTools.goToInstall(0);
      installCharts.waitForPage(installAlertingDriversPage);
      installCharts.nextPage();

      cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
      installCharts.installChart();
      cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
      clusterTools.waitForPage();
      cy.contains('Connected');
    });
  });

  // it.skip('can edit chart successfully', () => {
  //   // Note: this test fails due to https://github.com/rancher/dashboard/issues/9940
  //   // skipping this test until issue is resolved
  //   clusterTools.goTo();
  //   clusterTools.waitForPage();
  //   clusterTools.editChart(0);

  //   const installChart = new InstallChartPage();

  //   installChart.nextPage();

  //   cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=upgrade').as('chartUpdate');
  //   installChart.installChart();
  //   cy.wait('@chartUpdate').its('response.statusCode').should('eq', 201);
  //   clusterTools.waitForPage();
  //   cy.contains('Connected');
  // });

  // it.skip('can uninstall chart successfully', () => {
  //   // Note: this test fails due to https://github.com/rancher/dashboard/issues/9940
  //   // skipping this test until issue is resolved
  //   clusterTools.goTo();
  //   clusterTools.waitForPage();
  //   clusterTools.deleteChart(0);

  //   const promptRemove = new PromptRemove();

  //   cy.intercept('POST', '/v1/catalog.cattle.io.apps/default/rancher-alerting-drivers?action=uninstall').as('chartUninstall');
  //   promptRemove.remove();
  //   cy.wait('@chartUninstall').its('response.statusCode').should('eq', 201);
  //   cy.contains('Disconnected');
  // });
});
