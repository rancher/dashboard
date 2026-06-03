import ClusterToolsPagePo from '@/cypress/e2e/po/pages/explorer/cluster-tools.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { CLUSTER_APPS_BASE_URL, CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import { runTestWhenChartAvailable } from '@/cypress/support/commands/rancher-api-commands';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import LoadingPo from '@/cypress/e2e/po/components/loading.po';
import { qase } from '@/cypress/support/qase';

const clusterTools = new ClusterToolsPagePo('local');
const kubectl = new Kubectl();
const loadingPo = new LoadingPo('.loading-indicator');

describe('Cluster Tools', { tags: ['@explorer2', '@adminUser'] }, () => {
  const CHART = {
    name: 'Alerting Drivers',
    id:   'rancher-alerting-drivers',
    repo: 'rancher-charts'
  };
  const NAMESPACE = 'default';

  const cleanup = () => {
    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ NAMESPACE }/${ CHART.id }?action=uninstall`, '{}', false);
    cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ NAMESPACE }/${ CHART.id }`, (resp: any) => resp.status === 404, 20, { failOnStatusCode: false });
  };

  const waitForToolsPage = () => {
    clusterTools.goTo();
    clusterTools.waitForPage();
    cy.wait('@fetchChartData', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    cy.get('@fetchChartData.all').should('have.length.at.least', 3);
    loadingPo.checkNotExists(MEDIUM_TIMEOUT_OPT);
  };

  beforeEach(() => {
    cy.login();
    cy.intercept('GET', `${ CLUSTER_REPOS_BASE_URL }/**`).as('fetchChartData');
  });

  qase(2061, it('can navigate to cluster tools and see all feature charts', () => {
    const clusterDashboard = new ClusterDashboardPagePo('local');

    clusterDashboard.goTo();
    clusterDashboard.waitForPage();
    clusterDashboard.navToSideMenuEntryByLabel('Tools');
    clusterTools.waitForPage();

    cy.getClusterToolsChartCount().then((expectedCount) => {
      clusterTools.featureChartCards().should('have.length', expectedCount);
    });
  }));

  describe('Install', () => {
    beforeEach(function() {
      runTestWhenChartAvailable(CHART.repo, CHART.id, this, cleanup);
    });

    qase(2062, it('can deploy chart successfully', function() {
      runTestWhenChartAvailable(CHART.repo, CHART.id, this, () => {
        waitForToolsPage();

        clusterTools.getChartVersion(CHART.name).invoke('text').then((el) => {
          const chartVersion = el.trim();

          const installAlertingDriversPage = `repo-type=cluster&repo=${ CHART.repo }&chart=${ CHART.id }&version=${ chartVersion }&tools`;
          const installCharts = new InstallChartPage();

          clusterTools.goToInstall(CHART.name);
          installCharts.waitForPage(installAlertingDriversPage);
          installCharts.nextPage();

          cy.intercept('POST', `/v1/catalog.cattle.io.clusterrepos/${ CHART.repo }?action=install`).as('chartInstall');
          installCharts.installChart();
        });
        cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
        clusterTools.waitForPage();
        kubectl.waitForTerminalStatus('Connected');
        cy.waitForResourceState('v1', 'catalog.cattle.io.apps', `${ NAMESPACE }/${ CHART.id }`, 'deployed', 40);
        kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
      });
    }));
  });

  describe('Manage Installed Chart', () => {
    beforeEach(function() {
      runTestWhenChartAvailable(CHART.repo, CHART.id, this, () => {
        cleanup();
        cy.getChartVersions(CHART.repo, CHART.id).then((versions) => {
          cy.installChart(CHART.repo, CHART.id, CHART.name, versions[0], NAMESPACE);
        });
        cy.waitForResourceState('v1', 'catalog.cattle.io.apps', `${ NAMESPACE }/${ CHART.id }`, 'deployed', 40);
      });
    });

    qase(2063, it('can edit chart successfully', function() {
      runTestWhenChartAvailable(CHART.repo, CHART.id, this, () => {
        waitForToolsPage();
        clusterTools.editChart(CHART.name);

        const installChartPage = new InstallChartPage();

        installChartPage.nextPage();

        cy.intercept('POST', `v1/catalog.cattle.io.clusterrepos/${ CHART.repo }?action=upgrade`).as('chartUpdate');
        installChartPage.installChart();
        cy.wait('@chartUpdate').its('response.statusCode').should('eq', 201);
        clusterTools.waitForPage();
        kubectl.waitForTerminalStatus('Connected');
        cy.waitForResourceState('v1', 'catalog.cattle.io.apps', `${ NAMESPACE }/${ CHART.id }`, 'deployed', 40);
        kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
      });
    }));

    qase(2060, it('can uninstall chart successfully', function() {
      runTestWhenChartAvailable(CHART.repo, CHART.id, this, () => {
        waitForToolsPage();
        clusterTools.deleteChart(CHART.name);

        const promptRemove = new PromptRemove();

        promptRemove.checkbox().checkNotExists();

        cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/${ NAMESPACE }/${ CHART.id }?action=uninstall`).as('chartUninstall');
        promptRemove.remove();
        cy.wait('@chartUninstall').its('response.statusCode').should('eq', 201);
        // we can't check that the initial state is connected... as the supporting socket can connect and disconnect quicker than we can show the window
        // kubectl.waitForTerminalStatus('Connected');
        kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
      });
    }));
  });

  after(() => {
    cleanup();
  });
});
