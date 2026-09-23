import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { runTestWhenChartAvailable } from '@/cypress/support/commands/rancher-api-commands';
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
    cy.setUserPreference({ 'show-pre-release': true }, true); // Show pre-release versions so charts with only -rc versions appear on Charts page
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
    const namespacePicker = new NamespaceFilterPo();
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();
    const chartName = 'Rancher Backups';
    const customRegistry = 'my.custom.registry:5000';
    const chartNamespace = 'cattle-resources-system';
    const chartApp = 'rancher-backup';
    const chartCrd = 'rancher-backup-crd';

    // Uninstall (if present) and wait for the apps to actually be gone, rather than
    // just firing the uninstall request and moving on. This test relies on being able
    // to freshly *install* rancher-backup (not upgrade it): if a prior failed attempt
    // (e.g. a Cypress retry) left the app installed, install.vue treats it as an
    // upgrade instead (`this.existing` becomes truthy), which POSTs to
    // `?action=upgrade` instead of `?action=install` - so this test's
    // `cy.wait('@installApp')` never sees a matching request and times out, even
    // though the click and the resulting chart operation both succeeded. Ensuring a
    // clean slate before the test starts avoids that class of failure.
    //
    // IMPORTANT: this must be a beforeEach(), not a before(). Cypress only re-runs
    // beforeEach()/afterEach() hooks between retries of a failing test (retries.runMode
    // is 2 here) - before()/after() run exactly once for the whole describe block
    // regardless of retries (https://docs.cypress.io/app/guides/test-retries). A
    // before() here only protected the *first* attempt: if that attempt installed the
    // app successfully but then failed later for an unrelated reason (e.g. the app was
    // still "Pending-Install" when a later assertion needed "Deployed" - installs can
    // be slow on CI runners), every retry after that would find rancher-backup already
    // installed and hit the exact same "upgrade instead of install" failure again, since
    // nothing cleaned it up in between. This was confirmed against real CI runs: the
    // app's own "Age" in later attempts' screenshots lines up with it having been
    // created during the *same* attempt sequence, not a separate job or an old leftover.
    const cleanupInstalledApp = () => {
      cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}', false);
      cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}', false);
      cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartApp }`, (resp: any) => resp.status === 404, 20, { failOnStatusCode: false });
      cy.waitForRancherResource('v1', 'catalog.cattle.io.apps', `${ chartNamespace }/${ chartCrd }`, (resp: any) => resp.status === 404, 20, { failOnStatusCode: false });
    };

    beforeEach(() => {
      cleanupInstalledApp();
    });

    it('should persist custom registry when changing chart version', function() {
      runTestWhenChartAvailable('rancher-charts', 'rancher-backup', this, () => {
        const installedAppsPage = new ChartInstalledAppsListPagePo('local', 'apps');

        // We need to install the chart first to have the versions selector show up later when we come back to the install page
        ChartPage.navTo(null, chartName);
        chartPage.waitForChartHeader(chartName, MEDIUM_TIMEOUT_OPT);
        chartPage.goToInstall();
        installChartPage.nextPage();

        cy.intercept('POST', '/v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('installApp');
        installChartPage.installChart();
        namespacePicker.toggle();
        namespacePicker.clickOptionByLabel('All Namespaces');
        namespacePicker.isChecked('All Namespaces');
        namespacePicker.closeDropdown();
        installedAppsPage.waitForInstallCloseTerminal('installApp', ['rancher-backup', 'rancher-backup-crd']);

        ChartPage.navTo(null, chartName);
        chartPage.waitForChartHeader(chartName, MEDIUM_TIMEOUT_OPT);
        chartPage.goToInstall();

        // The version selector should now be visible
        installChartPage.chartVersionSelector().self().should('be.visible');

        installChartPage.customRegistryCheckbox().set();

        // install.vue re-derives showCustomRegistryInput (the checkbox's own v-model)
        // from the app's *current* registry setting whenever its `version` watcher's
        // async chain (which includes awaiting existing.fetchValues() on this "edit an
        // already-installed app" page) resolves - for a fresh install that's falsy. If
        // that chain is still in flight when the checkbox above is clicked, it can
        // silently uncheck itself again once it resolves, right after. The version
        // selector being visible only means the selector's own DOM exists, not that
        // this recompute has already settled, so give it a moment and re-click once if
        // the input never showed up, rather than failing outright.
        cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
        cy.get('body').then(($body) => {
          if ($body.find('[data-testid="custom-registry-input"]').length === 0) {
            installChartPage.customRegistryCheckbox().set();
          }
        });

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
    });

    after('clean up', () => {
      cleanupInstalledApp();
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });

  after(() => {
    cy.setUserPreference({ 'show-pre-release': false });
  });
});
