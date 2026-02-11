import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import ChartInstalledAppsListPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';
import { NamespaceFilterPo } from '@/cypress/e2e/po/components/namespace-filter.po';

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
      ChartPage.navTo(undefined, 'rancher-demo');
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
    const namespacePicker = new NamespaceFilterPo();
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();
    const chartName = 'Rancher Backups';
    const customRegistry = 'my.custom.registry:5000';

    it('should persist custom registry when changing chart version', () => {
      const installedAppsPage = new ChartInstalledAppsListPagePo('local', 'apps');

      // We need to install the chart first to have the versions selector show up later when we come back to the install page
      ChartPage.navTo(undefined, chartName);
      chartPage.waitForChartHeader(chartName, MEDIUM_TIMEOUT_OPT);
      chartPage.goToInstall();
      installChartPage.nextPage();

      // Set up namespace selection before installing
      namespacePicker.toggle();
      namespacePicker.clickOptionByLabel('All Namespaces');
      namespacePicker.isChecked('All Namespaces');
      namespacePicker.closeDropdown();

      // Set up API intercept right before the install action - use a single pattern that matches both
      cy.intercept('POST', /\/v1\/catalog\.cattle\.io\.(clusterrepos|apps)\/.*\?action=(install|upgrade)/).as('installOrUpgradeApp');

      // Now install the chart
      installChartPage.installChart();

      // Wait for install or upgrade to complete
      installedAppsPage.waitForInstallCloseTerminal('installOrUpgradeApp', ['rancher-backup', 'rancher-backup-crd']);

      ChartPage.navTo(undefined, chartName);
      chartPage.waitForChartHeader(chartName, MEDIUM_TIMEOUT_OPT);
      chartPage.goToInstall();

      // The version selector should now be visible
      installChartPage.chartVersionSelector().self().should('be.visible');

      installChartPage.customRegistryCheckbox().set();

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
      const chartNamespace = 'cattle-resources-system';
      const chartApp = 'rancher-backup';
      const chartCrd = 'rancher-backup-crd';

      cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}');
      cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}');
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
