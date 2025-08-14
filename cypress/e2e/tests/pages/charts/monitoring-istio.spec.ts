import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
// import { prometheusSpec } from '@/cypress/e2e/blueprints/charts/prometheus-chart';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { PrometheusTab } from '@/cypress/e2e/po/pages/explorer/charts/tabs/prometheus-tab.po';
import { GrafanaTab } from '@/cypress/e2e/po/pages/explorer/charts/tabs/grafana-tab.po';
// import { AlertingTab } from '@/cypress/e2e/po/pages/explorer/charts/tabs/alerting-tab.po';
import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
// import { DEFAULT_GRAFANA_STORAGE_SIZE } from '@shell/config/types.js';

describe('Charts', { tags: ['@charts', '@adminUser'] }, () => {
  const chartsPage = new ChartsPage();
  const chartPage = new ChartPage();
  const installChart = new InstallChartPage();
  const terminal = new Kubectl();
  const prometheus = new PrometheusTab();
  // const alerting = new AlertingTab();
  const CHART = {
    name: 'Monitoring',
    id:   'rancher-monitoring',
    repo: 'rancher-charts'
  };

  before(() => {
    cy.login();
    cy.viewport(1280, 720);
  });

  // after(() => {
  //   uninstallApp('cattle-monitoring-system', 'rancher-monitoring-crd');
  //   uninstallApp('cattle-monitoring-system', 'rancher-monitoring');
  // });

  // function uninstallApp(namespace: string, name: string) {
  //   cy.createRancherResource('v1', `catalog.cattle.io.apps/${ namespace }/${ name }?action=uninstall`, '{}');
  //   // Need to wait between uninstalls (not ideal)
  //   cy.wait(2000); // eslint-disable-line cypress/no-unnecessary-waiting
  // }

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
        chartPage.waitForChartPage(CHART.repo, CHART.id);
        chartPage.goToInstall();
        installChart.waitForChartPage(CHART.repo, CHART.id);

        // Check Grafana has all storage options: https://github.com/rancher/dashboard/issues/11540
        const grafana = new GrafanaTab();

        installChart.nextPage().selectTab(tabbedOptions, grafana.tabID());
        installChart.waitForChartPage(CHART.repo, CHART.id);
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
        installChart.waitForChartPage(CHART.repo, CHART.id);

        prometheus.scrollToTabBottom();

        prometheus.persistentStorage().checkVisible();
        prometheus.persistentStorage().set();

        prometheus.storageClass().checkExists();
        prometheus.storageClass().toggle();
        prometheus.storageClass().clickOptionWithLabel(storageClass);
        prometheus.storageClass().checkOptionSelected(storageClass);
      });

      // NOTE: Test disabled until we have a reliable way of waiting for the installation process to complete.
      // NOTE: There are two issues around this test:
      // - https://github.com/rancher/dashboard/issues/15253 (SSP issue)
      // - https://github.com/rancher/dashboard/issues/15260 (UI crash when uninstalling during installation)
      // it('Should install monitoring app with comprehensive configuration validation', () => {
      //   const tabbedOptions = new TabbedPo();
      //   const grafana = new GrafanaTab();

      //   ChartPage.navTo(null, 'Monitoring');
      //   chartPage.waitForChartPage(CHART.repo, CHART.id);

      //   // Get versions
      //   chartPage.getVersions().then((versions) => {
      //     const truncatedVersion = versions[0].substring(0, versions[0].indexOf('-rancher'));

      //     // Check latest selected by default
      //     chartPage.checkSelectedVersion(truncatedVersion);

      //     // Navigate to the edit options page
      //     chartPage.goToInstall();
      //     installChart.waitForChartPage(CHART.repo, CHART.id);

      //     // === PROMETHEUS CONFIGURATION ===
      //     installChart.nextPage().selectTab(tabbedOptions, prometheus.tabID());
      //     installChart.waitForChartPage(CHART.repo, CHART.id);

      //     // Scroll into view and configure persistent storage
      //     prometheus.persistentStorage().checkVisible();
      //     prometheus.persistentStorage().set();

      //     // to check custom box element width and height in order to prevent regression
      //     // https://github.com/rancher/dashboard/issues/10000
      //     prometheus.persistentStorage().hasAppropriateWidth();
      //     prometheus.persistentStorage().hasAppropriateHeight();

      //     // Configure storage class
      //     prometheus.storageClass().checkVisible();
      //     prometheus.storageClass().toggle();
      //     prometheus.storageClass().clickOptionWithLabel(storageClass);

      //     // Test add/remove selector functionality - previously this would result in empty selector being present
      //     // Regression test for: https://github.com/rancher/dashboard/issues/10016
      //     prometheus.scrollToTabBottom();
      //     installChart.self().find(`[data-testid="input-match-expression-add-rule"]`).click();
      //     installChart.self().find(`[data-testid="input-match-expression-remove-control-0"]`).click();

      //     // === GRAFANA CONFIGURATION ===
      //     installChart.selectTab(tabbedOptions, grafana.tabID());
      //     installChart.waitForChartPage(CHART.repo, CHART.id);

      //     // Configure Grafana resource requests/limits
      //     grafana.requestedCpu().checkExists();
      //     grafana.requestedCpu().checkVisible();
      //     grafana.requestedCpu().set('123m');

      //     grafana.requestedMemory().checkExists();
      //     grafana.requestedMemory().checkVisible();
      //     grafana.requestedMemory().set('567Mi');

      //     grafana.cpuLimit().checkExists();
      //     grafana.cpuLimit().checkVisible();
      //     grafana.cpuLimit().set('87m');

      //     grafana.memoryLimit().checkExists();
      //     grafana.memoryLimit().checkVisible();
      //     grafana.memoryLimit().set('123Mi');

      //     // Check default Grafana storage value for pvc and statefulset types
      //     // pvc
      //     grafana.storageOptions().set(2);
      //     grafana.storagePvcSizeInput().checkExists();
      //     grafana.storagePvcSizeInput().checkVisible();
      //     grafana.storagePvcSizeInput().self().invoke('val').should('equal', DEFAULT_GRAFANA_STORAGE_SIZE);
      //     // statefulset
      //     grafana.storageOptions().set(3);
      //     grafana.storageStatefulsetSizeInput().checkExists();
      //     grafana.storageStatefulsetSizeInput().checkVisible();
      //     grafana.storageStatefulsetSizeInput().self().invoke('val').should('equal', DEFAULT_GRAFANA_STORAGE_SIZE);
      //     // back to disabled
      //     grafana.storageOptions().set(0);

      //     // === ALERTING CONFIGURATION ===
      //     installChart.selectTab(tabbedOptions, alerting.tabID());
      //     installChart.waitForChartPage(CHART.repo, CHART.id);

      //     // Disable installing Alert Manager
      //     alerting.deployCheckbox().checkVisible();
      //     alerting.deployCheckbox().set();

      //     // === INSTALLATION ===
      //     // Click on YAML. In YAML mode, the prometheus selector is present but empty
      //     // It should not be sent to the API
      //     installChart.editYaml();

      //     installChart.installChart();

      //     // Wait for installation and validate all configurations
      //     cy.wait('@prometheusChartCreation', { requestTimeout: 10000 }).then((req) => {
      //       const monitoringChart = req.request?.body.charts.find((chart: any) => chart.chartName === 'rancher-monitoring');

      //       // Validate Prometheus configuration
      //       expect(monitoringChart.values.prometheus).to.deep.equal(prometheusSpec.values.prometheus);

      //       // Validate Grafana resource configuration
      //       const resource = monitoringChart.values.grafana.resources;

      //       expect(resource.requests.cpu).to.equal('123m');
      //       expect(resource.requests.memory).to.equal('567Mi');
      //       expect(resource.limits.cpu).to.equal('87m');
      //       expect(resource.limits.memory).to.equal('123Mi');
      //     });

      //     terminal.waitForTerminalStatus('Disconnected', RESTART_TIMEOUT_OPT);
      //     terminal.closeTerminalByTabName('Install cattle-monitoring-system:rancher-monitoring');
      //   });
      // });
    });
  });
});
