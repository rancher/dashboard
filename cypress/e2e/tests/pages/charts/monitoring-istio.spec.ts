import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { prometheusSpec } from '@/cypress/e2e/blueprints/charts/prometheus-chart';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { PrometheusTab } from '@/cypress/e2e/po/pages/explorer/charts/tabs/prometheus-tab.po';
import { GrafanaTab } from '@/cypress/e2e/po/pages/explorer/charts/tabs/grafana-tab.po';
import { AlertingTab } from '@/cypress/e2e/po/pages/explorer/charts/tabs/alerting-tab.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { DEFAULT_GRAFANA_STORAGE_SIZE } from '@shell/config/types.js';
import ChartInstalledAppsListPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';

describe('Charts', { tags: ['@charts', '@adminUser'] }, () => {
  const chartsPage = new ChartsPage();
  const chartPage = new ChartPage();
  const installChart = new InstallChartPage();
  const terminal = new Kubectl();
  const prometheus = new PrometheusTab();
  const alerting = new AlertingTab();
  const chartInstalledAppsListPage = new ChartInstalledAppsListPagePo('local', 'apps');

  before(() => {
    cy.login();
    cy.viewport(1280, 720);
  });

  after(() => {
    uninstallApp('cattle-monitoring-system', 'rancher-monitoring-crd');
    uninstallApp('cattle-monitoring-system', 'rancher-monitoring');
  });

  function uninstallApp(namespace: string, name: string) {
    cy.createRancherResource('v1', `catalog.cattle.io.apps/${ namespace }/${ name }?action=uninstall`, '{}');
    // Need to wait between uninstalls (not ideal)
    cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
  }

  describe('Monitoring', { testIsolation: 'off' }, () => {
    describe('Prometheus local provisioner config', () => {
      const provisionerVersion = 'v0.0.24';
      const storageClass = 'local-path';

      before(() => {
        ChartsPage.navTo();
        chartsPage.waitForPage();

        // Open terminal
        terminal.openTerminal(LONG_TIMEOUT_OPT);

        // kubectl commands
        terminal.executeCommand(`apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/${ provisionerVersion }/deploy/local-path-storage.yaml`)
          .executeCommand('create -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/examples/pvc/pvc.yaml')
          .executeCommand('create -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/examples/pod/pod.yaml');

        terminal.closeTerminal();
      });

      beforeEach(() => {
        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('prometheusChartCreation');
      });

      it('Prometheus and Grafana should have all relavant storage options and Storage Class inputs', () => {
        const tabbedOptions = new TabbedPo();

        ChartPage.navTo(null, 'Monitoring');
        chartPage.waitForChartPage('rancher-charts', 'rancher-monitoring');
        chartPage.goToInstall();
        installChart.waitForChartPage('rancher-charts', 'rancher-monitoring');

        // Check Grafana has all storage options: https://github.com/rancher/dashboard/issues/11540
        const grafana = new GrafanaTab();

        installChart.nextPage().selectTab(tabbedOptions, grafana.tabID());
        installChart.waitForChartPage('rancher-charts', 'rancher-monitoring');
        grafana.storageOptions().getAllOptions().should('have.length', 4);
        grafana.storageOptions().isChecked(0); // Disabled by default

        const options = ['Disabled', 'Enable With Existing PVC', 'Enable with PVC Template', 'Enable with StatefulSet Template'];

        options.forEach((option, index) => {
          grafana.storageOptions().getOptionByIndex(index).should('have.text', option);
        });

        // Check Grafana has storage class input: https://github.com/rancher/dashboard/issues/11539
        grafana.storageOptions().set(2);
        grafana.storageClass().checkExists();
        grafana.storageClass().toggle();
        grafana.storageClass().clickOptionWithLabel(storageClass);
        grafana.storageClass().checkOptionSelected(storageClass);

        grafana.storageOptions().set(3);
        grafana.storageClass().checkExists();
        grafana.storageClass().toggle();
        grafana.storageClass().clickOptionWithLabel(storageClass);
        grafana.storageClass().checkOptionSelected(storageClass);

        // Check Prometheus has storage class input: https://github.com/rancher/dashboard/issues/11539
        installChart.selectTab(tabbedOptions, prometheus.tabID());
        installChart.waitForChartPage('rancher-charts', 'rancher-monitoring');

        prometheus.scrollToTabBottom();

        prometheus.persistentStorage().checkVisible();
        prometheus.persistentStorage().set();

        prometheus.storageClass().checkExists();
        prometheus.storageClass().toggle();
        prometheus.storageClass().clickOptionWithLabel(storageClass);
        prometheus.storageClass().checkOptionSelected(storageClass);
      });

      it('Should not include empty prometheus selector when installing.', () => {
        ChartPage.navTo(null, 'Monitoring');

        chartPage.waitForChartPage('rancher-charts', 'rancher-monitoring');

        const tabbedOptions = new TabbedPo();

        // Get versions
        chartPage.getVersions().then((versions) => {
          const truncatedVersion = versions[0].substring(0, versions[0].indexOf('-rancher'));

          // Check latest selected by default
          chartPage.checkSelectedVersion(truncatedVersion);

          // Navigate to the edit options page and Set prometheus storage class
          chartPage.goToInstall();
          installChart.nextPage().selectTab(tabbedOptions, prometheus.tabID());

          installChart.waitForChartPage('rancher-charts', 'rancher-monitoring');

          // Scroll into view
          prometheus.persistentStorage().checkVisible();
          prometheus.persistentStorage().set();

          // to check custom box element width and height in order to prevent regression
          // https://github.com/rancher/dashboard/issues/10000
          prometheus.persistentStorage().hasAppropriateWidth();
          prometheus.persistentStorage().hasAppropriateHeight();

          // Scroll into view
          prometheus.storageClass().checkVisible();
          prometheus.storageClass().toggle();
          prometheus.storageClass().clickOptionWithLabel(storageClass);

          // Disable installing Alert Manager
          installChart.selectTab(tabbedOptions, alerting.tabID());

          installChart.waitForChartPage('rancher-charts', 'rancher-monitoring');

          alerting.deployCheckbox().checkVisible();
          alerting.deployCheckbox().set();

          // Click on YAML. In YAML mode, the prometheus selector is present but empty
          // It should not be sent to the API
          installChart.editYaml();

          installChart.installChart();

          cy.wait('@prometheusChartCreation', { requestTimeout: 10000 }).then((req) => {
            const monitoringChart = req.request?.body.charts.find((chart: any) => chart.chartName === 'rancher-monitoring');

            expect(monitoringChart.values.prometheus).to.deep.equal(prometheusSpec.values.prometheus);
          });

          chartInstalledAppsListPage.waitForPage(null, null, MEDIUM_TIMEOUT_OPT);
          terminal.closeTerminal();
        });
      });

      // Regression test for: https://github.com/rancher/dashboard/issues/10016
      it('Should not include empty prometheus selector when installing (add/remove selector).', () => {
        ChartPage.navTo(null, 'Monitoring');

        chartPage.waitForChartPage('rancher-charts', 'rancher-monitoring');

        const tabbedOptions = new TabbedPo();

        // Get versions
        chartPage.getVersions().then((versions) => {
          const truncatedVersion = versions[0].substring(0, versions[0].indexOf('-rancher'));

          // Check latest selected by default
          chartPage.checkSelectedVersion(truncatedVersion);

          // Set prometheus storage class
          chartPage.goToInstall();
          installChart.nextPage().selectTab(tabbedOptions, prometheus.tabID());
          installChart.waitForChartPage('rancher-charts', 'rancher-monitoring');

          // Scroll into view
          prometheus.persistentStorage().checkVisible();
          prometheus.persistentStorage().set();

          prometheus.scrollToTabBottom();

          prometheus.storageClass().toggle();
          prometheus.storageClass().clickOptionWithLabel(storageClass);

          // Add a selector and then remove it - previously this would result in the empty selector being present
          installChart.self().find(`[data-testid="input-match-expression-add-rule"]`).click();
          installChart.self().find(`[data-testid="input-match-expression-remove-control-0"]`).click();

          // Click on YAML. In YAML mode, the prometheus selector is present but empty
          // It should not be sent to the API
          installChart.editYaml();

          installChart.installChart();

          cy.wait('@prometheusChartCreation', { requestTimeout: 10000 }).then((req) => {
            const monitoringChart = req.request?.body.charts.find((chart: any) => chart.chartName === 'rancher-monitoring');

            expect(monitoringChart.values.prometheus).to.deep.equal(prometheusSpec.values.prometheus);
          });

          chartInstalledAppsListPage.waitForPage(null, null, MEDIUM_TIMEOUT_OPT);
          terminal.closeTerminal();
        });
      });
    });

    describe('Grafana resource configuration', () => {
      beforeEach(() => {
        ChartPage.navTo(null, 'Monitoring');
        chartPage.waitForChartPage('rancher-charts', 'rancher-monitoring');

        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?*', {
          statusCode: 201,
          body:       {
            type:               'chartActionOutput',
            links:              {},
            operationName:      'helm-operation-test',
            operationNamespace: 'fleet-local'
          }
        }).as('prometheusChartCreation');

        cy.intercept('GET', 'v1/catalog.cattle.io.operations/fleet-local/helm-operation-test?*', {
          statusCode: 200,
          body:       {
            id:   'fleet-local/helm-operation-test',
            kind: 'Operation',
          }
        });
      });

      it('Should allow for Grafana resource requests/limits configuration', () => {
        const tabbedOptions = new TabbedPo();
        const grafana = new GrafanaTab();

        // Set Grafana resource request/limits configuration
        chartPage.goToInstall();
        installChart.waitForChartPage('rancher-charts', 'rancher-monitoring');

        installChart.nextPage().selectTab(tabbedOptions, grafana.tabID());
        installChart.waitForChartPage('rancher-charts', 'rancher-monitoring');

        grafana.requestedCpu().checkExists();
        grafana.requestedCpu().checkVisible();
        grafana.requestedCpu().set('123m');

        grafana.requestedMemory().checkExists();
        grafana.requestedMemory().checkVisible();
        grafana.requestedMemory().set('567Mi');

        grafana.cpuLimit().checkExists();
        grafana.cpuLimit().checkVisible();
        grafana.cpuLimit().set('87m');

        grafana.memoryLimit().checkExists();
        grafana.memoryLimit().checkVisible();
        grafana.memoryLimit().set('123Mi');

        // Check default Grafana storage value for pvc and statefulset types
        // pvc
        grafana.storageOptions().set(2);
        grafana.storagePvcSizeInput().checkExists();
        grafana.storagePvcSizeInput().checkVisible();
        grafana.storagePvcSizeInput().self().invoke('val').should('equal', DEFAULT_GRAFANA_STORAGE_SIZE);
        // statefulset
        grafana.storageOptions().set(3);
        grafana.storageStatefulsetSizeInput().checkExists();
        grafana.storageStatefulsetSizeInput().checkVisible();
        grafana.storageStatefulsetSizeInput().self().invoke('val').should('equal', DEFAULT_GRAFANA_STORAGE_SIZE);
        // back to disabled
        grafana.storageOptions().set(0);

        // Click on YAML. In YAML mode, the prometheus selector is present but empty
        // It should not be sent to the API
        installChart.editYaml();

        installChart.installChart();

        cy.wait('@prometheusChartCreation', { requestTimeout: 10000 }).then((req) => {
          const monitoringChart = req.request?.body.charts.find((chart: any) => chart.chartName === 'rancher-monitoring');
          const resource = monitoringChart.values.grafana.resources;

          expect(resource.requests.cpu).to.equal('123m');
          expect(resource.requests.memory).to.equal('567Mi');
          expect(resource.limits.cpu).to.equal('87m');
          expect(resource.limits.memory).to.equal('123Mi');
        });
      });
    });
  });
});
