import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { prometheusSpec } from '@/cypress/e2e/blueprints/charts/prometheus-chart';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { PrometheusTab } from '@/cypress/e2e/po/pages/explorer/charts/tabs/prometheus-tab.po';
import { GrafanaTab } from '@/cypress/e2e/po/pages/explorer/charts/tabs/grafana-tab.po';

describe('Charts', { tags: ['@charts', '@adminUser'] }, () => {
  const chartsPage = new ChartsPage();
  const chartPage = new ChartPage();
  const installChart = new InstallChartPage();
  const terminal = new Kubectl();
  const prometheus = new PrometheusTab();

  before(() => {
    cy.login();
    cy.viewport(1280, 720);
  });

  describe('Monitoring', { testIsolation: 'off' }, () => {
    describe('Prometheus local provisioner config', () => {
      const provisionerVersion = 'v0.0.24';

      // Install the chart
      before(() => {
        ChartsPage.navTo();
        chartsPage.waitForPage();

        // Open terminal
        terminal.openTerminal();

        // kubectl commands
        terminal.executeCommand(`apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/${ provisionerVersion }/deploy/local-path-storage.yaml`)
          .executeCommand('create -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/examples/pvc/pvc.yaml')
          .executeCommand('create -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/examples/pod/pod.yaml');

        terminal.closeTerminal();
      });

      beforeEach(() => {
        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('prometheusChartCreation');
      });

      it('Should not include empty prometheus selector when installing.', () => {
        ChartPage.navTo(null, 'Monitoring');

        chartPage.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring');

        const tabbedOptions = new TabbedPo();

        // Navigate to the edit options page and Set prometheus storage class

        chartPage.goToInstall();
        installChart.nextPage().editOptions(tabbedOptions, '[data-testid="btn-prometheus"]');
        installChart.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring');

        // Scroll into view
        prometheus.persistentStorage().checkVisible();
        prometheus.persistentStorage().set();

        // to check custom box element width and height in order to prevent regression
        // https://github.com/rancher/dashboard/issues/10000
        prometheus.persistentStorage().hasAppropriateWidth();
        prometheus.persistentStorage().hasAppropriateHeight();

        prometheus.storageClass().toggle();
        prometheus.storageClass().clickOptionWithLabel('local-path');

        // Click on YAML. In YAML mode, the prometheus selector is present but empty
        // It should not be sent to the API
        installChart.editYaml();

        installChart.installChart();

        cy.wait('@prometheusChartCreation', { requestTimeout: 10000 }).then((req) => {
          const monitoringChart = req.request?.body.charts.find((chart: any) => chart.chartName === 'rancher-monitoring');

          expect(monitoringChart.values.prometheus).to.deep.equal(prometheusSpec.values.prometheus);
        });

        terminal.closeTerminal();
      });

      // Regression test for: https://github.com/rancher/dashboard/issues/10016
      it('Should not include empty prometheus selector when installing (add/remove selector).', () => {
        ChartPage.navTo(null, 'Monitoring');

        chartPage.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring');

        const tabbedOptions = new TabbedPo();

        // Set prometheus storage class
        chartPage.goToInstall();
        installChart.nextPage().editOptions(tabbedOptions, '[data-testid="btn-prometheus"]');
        installChart.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring');

        // Scroll into view
        prometheus.persistentStorage().checkVisible();
        prometheus.persistentStorage().set();

        prometheus.storageClass().toggle();
        prometheus.storageClass().clickOptionWithLabel('local-path');

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

        terminal.closeTerminal();
      });
    });

    describe('Grafana resource configuration', () => {
      beforeEach(() => {
        ChartPage.navTo(null, 'Monitoring');
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
        installChart.nextPage().editOptions(tabbedOptions, '[data-testid="btn-grafana"');

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

  /**
   * Istio requires Prometheus operator to be installed, see previous steps.
   */
  describe('Istio', () => {
    beforeEach(() => {
      cy.login();
      HomePagePo.goTo();
    });

    describe('Istio local provisioning', () => {
      it('Should install Istio', () => {
        ChartPage.navTo(null, 'Istio');

        chartPage.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-istio');

        chartPage.goToInstall();
        installChart.nextPage();
        installChart.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-istio');

        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
        installChart.installChart();
        cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
      });

      it('Side-nav should contain Istio menu item', () => {
        ClusterDashboardPagePo.navTo();

        const productMenu = new ProductNavPo();

        productMenu.navToSideMenuGroupByLabel('Istio');

        cy.contains('Overview').should('exist');
        cy.contains('Powered by Istio').should('exist');
      });
    });
  });
});
