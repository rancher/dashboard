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
import CardPo from '@/cypress/e2e/po/components/card.po';
import { coerce, satisfies } from 'semver';

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

  describe('Remove a chart whose CRD app is already gone', () => {
    const CRD_CHART = {
      name: 'Supportability Review',
      id:   'rancher-supportability-review',
      crd:  'rancher-supportability-review-crd',
      repo: 'rancher-charts'
    };
    let chartNamespace: string;

    const appId = (name: string) => `${ chartNamespace }/${ name }`;

    const appState = (name: string): Cypress.Chainable<string> => cy.request({
      url:              `${ Cypress.env('api') }/v1/catalog.cattle.io.apps/${ appId(name) }`,
      headers:          { Accept: 'application/json' },
      failOnStatusCode: false
    }).then((resp) => (resp.status === 200 ? resp.body?.metadata?.state?.name || 'unknown' : 'absent'));

    const uninstallApp = (name: string) => {
      cy.createRancherResource('v1', `catalog.cattle.io.apps/${ appId(name) }?action=uninstall`, '{}', false);
      cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', appId(name), (resp: any) => resp?.status === 404, 80, { failOnStatusCode: false })
        .should('eq', true);
    };

    const installApp = (chartId: string, chartName: string, version: string) => {
      cy.installChart(CRD_CHART.repo, chartId, chartName, version, chartNamespace);
      cy.waitForResourceState('v1', 'catalog.cattle.io.apps', appId(chartId), 'deployed', 200)
        .should('eq', true);
    };

    const newestCompatibleVersion = (): Cypress.Chainable<any> => cy.getRancherVersion().then(({ Version }) => {
      const rancherVersion = coerce(Cypress.env('rancherVersion') || Version);

      return cy.request({
        url:     `${ Cypress.env('api') }${ CLUSTER_REPOS_BASE_URL }/${ CRD_CHART.repo }?link=index`,
        headers: { Accept: 'application/json' }
      }).then((resp) => {
        const versions = resp.body.entries[CRD_CHART.id];
        const compatible = versions.find((chart: any) => {
          const range = chart.annotations?.['catalog.cattle.io/rancher-version'];

          return !rancherVersion || !range || satisfies(rancherVersion, range);
        });

        return compatible || versions[0];
      });
    });

    const installChartWithoutCrdApp = () => {
      newestCompatibleVersion().then((chart) => {
        chartNamespace = chart.annotations['catalog.cattle.io/namespace'];

        appState(CRD_CHART.id).then((app) => {
          appState(CRD_CHART.crd).then((crd) => {
            if (app === 'deployed' && crd === 'absent') {
              return;
            }

            uninstallApp(CRD_CHART.id);
            uninstallApp(CRD_CHART.crd);
            installApp(CRD_CHART.crd, CRD_CHART.crd, chart.version);
            installApp(CRD_CHART.id, CRD_CHART.name, chart.version);
            uninstallApp(CRD_CHART.crd);
          });
        });
      });
    };

    beforeEach(function() {
      runTestWhenChartAvailable(CRD_CHART.repo, CRD_CHART.id, this, installChartWithoutCrdApp);
    });

    it('can remove the chart with "Delete the CRD" ticked', function() {
      runTestWhenChartAvailable(CRD_CHART.repo, CRD_CHART.id, this, () => {
        cy.intercept('GET', new RegExp(`${ CLUSTER_APPS_BASE_URL }/${ appId(CRD_CHART.crd) }(\\?|$)`)).as('findCrdApp');
        cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/${ appId(CRD_CHART.id) }?action=uninstall`).as('chartUninstall');
        cy.intercept('POST', `${ CLUSTER_APPS_BASE_URL }/${ appId(CRD_CHART.crd) }?action=uninstall`).as('crdUninstall');

        waitForToolsPage();
        clusterTools.deleteChart(CRD_CHART.name);

        const promptRemove = new PromptRemove();
        const promptCard = new CardPo('[data-testid="card"].prompt-remove');

        promptRemove.checkbox().set();
        cy.wait('@findCrdApp').its('response.statusCode').should('eq', 404);
        promptRemove.checkbox().isChecked();
        promptCard.self().find('.text-error').should('not.exist');
        promptCard.self().find('b').should(($names) => {
          const names = $names.toArray().map((name) => name.textContent);

          expect(names).to.include(CRD_CHART.id);
          expect(names).not.to.include(CRD_CHART.crd);
        });

        promptRemove.remove();
        cy.wait('@chartUninstall').its('response.statusCode').should('eq', 201);
        promptCard.checkNotExists(MEDIUM_TIMEOUT_OPT);
        kubectl.waitForTerminalStatus('Disconnected', MEDIUM_TIMEOUT_OPT);
        cy.get('@crdUninstall.all').should('have.length', 0);
        cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', appId(CRD_CHART.id), (resp: any) => resp?.status === 404, 80, { failOnStatusCode: false })
          .should('eq', true);
      });
    });

    after(() => {
      if (chartNamespace) {
        uninstallApp(CRD_CHART.id);
        uninstallApp(CRD_CHART.crd);
      }
    });
  });

  after(() => {
    cleanup();
  });
});
