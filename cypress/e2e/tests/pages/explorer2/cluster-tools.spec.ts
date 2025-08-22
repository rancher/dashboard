import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { CLUSTER_APPS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const clusterTools = new ClusterToolsPagePo('local');
const kubectl = new Kubectl();

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
    clusterTools.getChartVersion('Alerting Drivers').invoke('text').then((el) => {
      const chartVersion = el.trim();

      const chartType = 'rancher-alerting-drivers';
      const installAlertingDriversPage = `repo-type=cluster&repo=rancher-charts&chart=${ chartType }&version=${ chartVersion }&tools`;
      const installCharts = new InstallChartPage();

      clusterTools.goToInstall('Alerting Drivers');
      installCharts.waitForPage(installAlertingDriversPage);
      installCharts.nextPage();

      cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
      installCharts.installChart();
      cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
      clusterTools.waitForPage();
      kubectl.waitForTerminalStatus('Connected');
      kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
    });
  });

  it('can edit chart successfully', () => {
    clusterTools.goTo();
    clusterTools.waitForPage();
    clusterTools.editChart('Alerting Drivers');

    const installChart = new InstallChartPage();

    installChart.nextPage();

    cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=upgrade').as('chartUpdate');
    installChart.installChart();
    cy.wait('@chartUpdate').its('response.statusCode').should('eq', 201);
    clusterTools.waitForPage();
    kubectl.waitForTerminalStatus('Connected');
    kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
  });

  it('can uninstall chart successfully', () => {
    clusterTools.goTo();
    clusterTools.waitForPage();
    clusterTools.deleteChart('Alerting Drivers');

    const promptRemove = new PromptRemove();

    promptRemove.checkbox().checkNotExists();

    cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/default/rancher-alerting-drivers?action=uninstall`).as('chartUninstall');
    promptRemove.remove();
    cy.wait('@chartUninstall').its('response.statusCode').should('eq', 201);
    // we can't check that the initial state is connected... as the supporting socket can connect and disconnect quicker than we can show the window
    // kubectl.waitForTerminalStatus('Connected');
    kubectl.waitForTerminalStatus('Disconnected');
  });
});
