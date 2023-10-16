import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { InstallChartsPage } from '@/cypress/e2e/po/pages/explorer/install-charts.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const clusterTools = new ClusterToolsPagePo('local');

describe('Cluster Tools', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('can navigate to cluster tools and see all feature charts', () => {
    const clusterDashboard = new ClusterDashboardPagePo('local');

    clusterDashboard.goTo();
    clusterDashboard.waitForPage();
    clusterDashboard.clusterToolsButton().click();

    clusterTools.waitForPage();
    clusterTools.featureChartCards().should('have.length', 11);
    clusterTools.featureChartCards().eq(0).should('contain', 'Alerting Drivers');
    clusterTools.featureChartCards().eq(1).should('contain', 'CIS Benchmark');
    clusterTools.featureChartCards().eq(2).should('contain', 'Elemental');

    clusterTools.featureChartCards().eq(3).should('contain', 'Istio');
    clusterTools.featureChartCards().eq(4).should('contain', 'Logging');
    clusterTools.featureChartCards().eq(5).should('contain', 'Longhorn');
    clusterTools.featureChartCards().eq(6).should('contain', 'Monitoring');
    clusterTools.featureChartCards().eq(7).should('contain', 'NeuVector');
    clusterTools.featureChartCards().eq(8).should('contain', 'NeuVector Monitor');
    clusterTools.featureChartCards().eq(9).should('contain', 'OPA Gatekeeper');
    clusterTools.featureChartCards().eq(10).should('contain', 'Rancher Backups');
  });

  it('can deploy chart successfully', () => {
    clusterTools.goTo();
    clusterTools.waitForPage();
    clusterTools.getChartVersion(0).invoke('text').then((el) => {
      const chartVersion = el.trim().slice(1);

      const chartsPageUrl = '/c/local/apps/charts/install?repo-type=cluster&repo=rancher-charts';
      const chartType = 'rancher-alerting-drivers';

      const installAlertingDriversPage = `${ chartsPageUrl }&chart=${ chartType }&version=${ chartVersion }&tools`;

      const installCharts = new InstallChartsPage(installAlertingDriversPage);

      clusterTools.goToInstall(0);
      installCharts.waitForPage();
      installCharts.nextPage();

      cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
      installCharts.installChart().click();
      cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
      clusterTools.waitForPage();
      cy.contains('Connected');
    });
  });

  it('can edit chart successfully', () => {
    clusterTools.goTo();
    clusterTools.waitForPage();
    clusterTools.editChart(0);

    const installCharts = new InstallChartsPage();

    installCharts.nextPage();

    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=upgrade').as('chartUpdate');
    installCharts.installChart().click();
    cy.wait('@chartUpdate').its('response.statusCode').should('eq', 201);
    clusterTools.waitForPage();
    cy.contains('Connected');
  });

  it('can uninstall chart successfully', () => {
    clusterTools.goTo();
    clusterTools.waitForPage();
    clusterTools.deleteChart(0);

    const promptRemove = new PromptRemove();

    cy.intercept('POST', '/v1/catalog.cattle.io.apps/default/rancher-alerting-drivers?action=uninstall').as('chartUninstall');
    promptRemove.remove();
    cy.wait('@chartUninstall').its('response.statusCode').should('eq', 201);
    cy.contains('Disconnected');
  });
});
