import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import CheckboxPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { prometheusSpec } from '@/cypress/e2e/blueprints/charts/prometheus-chart';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { ChartPage } from '@/cypress/e2e/po/pages/chart.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';

describe('Charts', { tags: ['@charts', '@adminUser'] }, () => {
  const chartsPage = new ChartsPage();
  const chartPage = new ChartPage();
  const installChartPage = new ChartPage('local', true);
  const terminal = new Kubectl();

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
        cy.getRancherResource('v1', 'catalog.cattle.io.clusterrepos', 'rancher-charts?link=index', 200).then((resp: Cypress.Response<any>) => {
          const version = resp.body.entries['rancher-monitoring-crd'][1]['version'];

          cy.wrap(version).as('chartVersion');
        });

        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('prometheusChartCreation');
      });

      it('Should not include empty prometheus selector when installing.', () => {
        ChartPage.navTo(null, 'Monitoring');
        cy.get<string>('@chartVersion').then((chartVersion) => {
          const urlVersion = chartVersion.replace('+', '%2B');

          chartPage.waitForPage(`repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring&version=${ urlVersion }`);

          const tabbedOptions = new TabbedPo();

          // Navigate to the edit options page and Set prometheus storage class

          installChartPage.goToInstall().nextPage().editOptions(tabbedOptions, '[data-testid="btn-prometheus"]');
          installChartPage.waitForPage(`repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring&version=${ urlVersion }`, 'prometheus');
        });

        const enableStorageCheckbox = new CheckboxPo('[data-testid="checkbox-chart-enable-persistent-storage"]');

        // Scroll into view
        enableStorageCheckbox.checkVisible();

        enableStorageCheckbox.set();
        // to check custom box element width and height in order to prevent regression
        // https://github.com/rancher/dashboard/issues/10000
        enableStorageCheckbox.hasAppropriateWidth();
        enableStorageCheckbox.hasAppropriateHeight();

        const labeledSelectPo = new LabeledSelectPo('[data-testid="select-chart-prometheus-storage-class"]');

        labeledSelectPo.toggle();
        labeledSelectPo.clickOptionWithLabel('local-path');

        // Click on YAML. In YAML mode, the prometheus selector is present but empty
        // It should not be sent to the API
        installChartPage.editYaml();

        installChartPage.installChart();

        cy.wait('@prometheusChartCreation', { requestTimeout: 10000 }).then((req) => {
          const monitoringChart = req.request?.body.charts.find((chart: any) => chart.chartName === 'rancher-monitoring');

          expect(monitoringChart.values.prometheus).to.deep.equal(prometheusSpec.values.prometheus);
        });

        terminal.closeTerminal();
      });

      // Regression test for: https://github.com/rancher/dashboard/issues/10016
      it('Should not include empty prometheus selector when installing (add/remove selector).', () => {
        ChartPage.navTo(null, 'Monitoring');
        cy.get<string>('@chartVersion').then((chartVersion) => {
          const urlVersion = chartVersion.replace('+', '%2B');

          chartPage.waitForPage(`repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring&version=${ urlVersion }`);

          const tabbedOptions = new TabbedPo();

          // Set prometheus storage class
          chartPage.goToInstall().nextPage().editOptions(tabbedOptions, '[data-testid="btn-prometheus"]');
          installChartPage.waitForPage(`repo-type=cluster&repo=rancher-charts&chart=rancher-monitoring&version=${ urlVersion }`, 'prometheus');
        });

        const enableStorageCheckbox = new CheckboxPo('[data-testid="checkbox-chart-enable-persistent-storage"]');

        // Scroll into view
        enableStorageCheckbox.checkVisible();

        enableStorageCheckbox.set();

        const labeledSelectPo = new LabeledSelectPo('[data-testid="select-chart-prometheus-storage-class"]');

        labeledSelectPo.toggle();
        labeledSelectPo.clickOptionWithLabel('local-path');

        // Add a selector and then remove it - previously this would result in the empty selector being present
        installChartPage.self().find(`[data-testid="input-match-expression-add-rule"]`).click();
        installChartPage.self().find(`[data-testid="input-match-expression-remove-control-0"]`).click();

        // Click on YAML. In YAML mode, the prometheus selector is present but empty
        // It should not be sent to the API
        installChartPage.editYaml();

        installChartPage.installChart();

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

        // Set Grafana resource request/limits configuration
        chartPage.goToInstall().nextPage().editOptions(tabbedOptions, '[data-testid="btn-grafana"');

        const requestsCpu = new LabeledInputPo(`[data-testid="input-grafana-requests-cpu"]`, tabbedOptions.self());

        requestsCpu.checkExists();
        requestsCpu.checkVisible();
        requestsCpu.set('123m');

        const requestsMemory = new LabeledInputPo(`[data-testid="input-grafana-requests-memory"]`, tabbedOptions.self());

        requestsMemory.checkExists();
        requestsMemory.checkVisible();
        requestsMemory.set('567Mi');

        const limitsCpu = new LabeledInputPo(`[data-testid="input-grafana-limits-cpu"]`, tabbedOptions.self());

        limitsCpu.checkExists();
        limitsCpu.checkVisible();
        limitsCpu.set('87m');

        const limitsMemory = new LabeledInputPo(`[data-testid="input-grafana-limits-memory"]`, tabbedOptions.self());

        limitsMemory.checkExists();
        limitsMemory.checkVisible();
        limitsMemory.set('123Mi');

        // Click on YAML. In YAML mode, the prometheus selector is present but empty
        // It should not be sent to the API
        chartPage.editYaml();

        chartPage.installChart();

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

      cy.getRancherResource('v1', 'catalog.cattle.io.clusterrepos', 'rancher-charts?link=index', 200).then((resp: Cypress.Response<any>) => {
        const version = resp.body.entries['rancher-istio'][0]['version'];

        cy.wrap(version).as('chartVersion');
      });
    });

    describe('Istio local provisioning', () => {
      it('Should install Istio', () => {
        ChartPage.navTo(null, 'Istio');
        cy.get<string>('@chartVersion').then((chartVersion) => {
          const urlVersion = chartVersion.replace('+', '%2B');

          chartPage.waitForPage(`repo-type=cluster&repo=rancher-charts&chart=rancher-istio&version=${ urlVersion }`);

          chartPage.goToInstall().nextPage();
          installChartPage.waitForPage(`repo-type=cluster&repo=rancher-charts&chart=rancher-istio&version=${ urlVersion }`);
        });

        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
        chartPage.installChart();
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
