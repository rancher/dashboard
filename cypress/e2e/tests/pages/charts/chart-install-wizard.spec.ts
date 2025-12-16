import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

const configMapPayload = {
  apiVersion: 'v1',
  kind:       'ConfigMap',
  metadata:   {
    name:        `e2e-test-${ +new Date() }`,
    annotations: {},
    labels:      {},
    namespace:   'default'
  },
  data:    { foo: 'bar' },
  __clone: true
};

describe('Charts Wizard', { testIsolation: 'off', tags: ['@charts', '@adminUser', '@noVai'] }, () => {
  const testChartsRepoName = 'test-charts';
  const testChartsGitRepoUrl = 'https://github.com/richard-cox/rodeo';
  const testChartsBranchName = 'master';

  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  describe('Check resources are selectable in the chart install wizard', () => {
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();
    const tabbedPo = new TabbedPo('[data-testid="tabbed-block"]');

    before(() => {
      cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
        type:     'catalog.cattle.io.clusterrepo',
        metadata: { name: testChartsRepoName },
        spec:     {
          clientSecret: null, gitRepo: testChartsGitRepoUrl, gitBranch: testChartsBranchName
        }
      });

      cy.createRancherResource('v1', 'configmaps', configMapPayload);
    });

    it('Resource dropdown picker has ConfigMaps listed', () => {
      ChartPage.navTo(null, 'rancher-demo');
      chartPage.waitForChartHeader('rancher-demo', MEDIUM_TIMEOUT_OPT);
      chartPage.goToInstall();
      installChartPage.chartName().type('rancher-demo');
      installChartPage.nextPage();
      tabbedPo.allTabs().should('have.length', 4);
      installChartPage.selectTab(tabbedPo, 'Other Demo Fields');

      const labeledSelect = new LabeledSelectPo('section[id="Other Demo Fields"] [type="search"]');

      labeledSelect.self().scrollIntoView();
      labeledSelect.toggle();
      labeledSelect.clickLabel(`${ configMapPayload.metadata.name }`);
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', testChartsRepoName);
      cy.deleteRancherResource('v1', 'configmaps', `${ configMapPayload.metadata.namespace }/${ configMapPayload.metadata.name }` );
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });

  describe('Custom registry', () => {
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();
    const chartName = 'Kubewarden';
    const customRegistry = 'my.custom.registry:5000';
    const newRepoName = 'kubewarden-charts';

    before(() => {
      cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
        type:     'catalog.cattle.io.clusterrepo',
        metadata: { name: newRepoName },
        spec:     { url: 'https://charts.kubewarden.io' }
      });
    });

    it('should persist custom registry when changing chart version', () => {
      ChartPage.navTo(null, chartName);
      chartPage.waitForChartHeader(chartName, MEDIUM_TIMEOUT_OPT);
      chartPage.goToInstall();

      installChartPage.customRegistryCheckbox().isChecked();

      // Enter custom registry
      installChartPage.customRegistryInput().self().should('be.visible');
      installChartPage.customRegistryInput().set(customRegistry);

      // Change chart version
      installChartPage.chartVersionSelector().toggle();
      installChartPage.chartVersionSelector().clickOption(2);

      // Verify custom registry is still there
      installChartPage.customRegistryCheckbox().isChecked();
      installChartPage.customRegistryInput().self().should('have.value', customRegistry);
    });

    after('clean up', () => {
      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', newRepoName);
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
