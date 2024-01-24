/* eslint-disable cypress/no-unnecessary-waiting */
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import CheckboxPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

import { prometheusSpec } from '@/cypress/e2e/blueprints/charts/prometheus-chart';

describe('Charts', { tags: ['@charts', '@adminUser'] }, () => {
  const chartsPageUrl = '/c/local/apps/charts/chart?repo-type=cluster&repo=rancher-charts';

  describe('Monitoring', () => {
    const chartsMonitoringPage = `${ chartsPageUrl }&chart=rancher-monitoring`;

    const chartsPage: ChartsPage = new ChartsPage(chartsMonitoringPage);

    before(() => {
      cy.login();
      cy.viewport(1280, 720);
      chartsPage.goTo();
    });

    describe('Prometheus local provisioner config', () => {
      const provisionerVersion = 'v0.0.24';

      // Install the chart and navigate to the edit options page
      before(() => {
        // Open terminal
        const terminal = new Kubectl();

        terminal.openTerminal();

        // kubectl commands
        terminal.executeCommand(`apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/${ provisionerVersion }/deploy/local-path-storage.yaml`)
          .executeCommand('create -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/examples/pvc/pvc.yaml')
          .executeCommand('create -f https://raw.githubusercontent.com/rancher/local-path-provisioner/master/examples/pod/pod.yaml');

        terminal.closeTerminal();
      });

      // Don't actually install the chart, just navigate to the edit options page
      beforeEach(() => {
        cy.login();
        chartsPage.goTo();
        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('prometheusChartCreation');
      });

      it('Should not include empty prometheus selector when installing.', () => {
        const tabbedOptions = new TabbedPo();

        // Set prometheus storage class
        chartsPage.goToInstall().nextPage().editOptions(tabbedOptions, '[data-testid="btn-prometheus"');

        const enableStorageCheckbox = new CheckboxPo('[data-testid="checkbox-chart-enable-persistent-storage"]');

        // Scroll into view
        enableStorageCheckbox.checkVisible();

        enableStorageCheckbox.set();

        const labeledSelectPo = new LabeledSelectPo('[data-testid="select-chart-prometheus-storage-class"]');

        labeledSelectPo.toggle();
        labeledSelectPo.clickOptionWithLabel('local-path');

        // Click on YAML. In YAML mode, the prometheus selector is present but empty
        // It should not be sent to the API
        chartsPage.editYaml();

        chartsPage.installChart();

        cy.wait('@prometheusChartCreation', { requestTimeout: 10000 }).then((req) => {
          const monitoringChart = req.request?.body.charts.find((chart: any) => chart.chartName === 'rancher-monitoring');

          expect(monitoringChart.values.prometheus).to.deep.equal(prometheusSpec.values.prometheus);
        });
      });

      // Regression test for: https://github.com/rancher/dashboard/issues/10016
      it('Should not include empty prometheus selector when installing (add/remove selector).', () => {
        const tabbedOptions = new TabbedPo();

        // Set prometheus storage class
        chartsPage.goToInstall().nextPage().editOptions(tabbedOptions, '[data-testid="btn-prometheus"');

        const enableStorageCheckbox = new CheckboxPo('[data-testid="checkbox-chart-enable-persistent-storage"]');

        // Scroll into view
        enableStorageCheckbox.checkVisible();

        enableStorageCheckbox.set();

        const labeledSelectPo = new LabeledSelectPo('[data-testid="select-chart-prometheus-storage-class"]');

        labeledSelectPo.toggle();
        labeledSelectPo.clickOptionWithLabel('local-path');

        // Add a selector and then remove it - previously this would result in the empty selector being present
        chartsPage.self().find(`[data-testid="input-match-expression-add-rule"]`).click();
        chartsPage.self().find(`[data-testid="input-match-expression-remove-control-0"]`).click();

        // Click on YAML. In YAML mode, the prometheus selector is present but empty
        // It should not be sent to the API
        chartsPage.editYaml();

        chartsPage.installChart();

        cy.wait('@prometheusChartCreation', { requestTimeout: 10000 }).then((req) => {
          const monitoringChart = req.request?.body.charts.find((chart: any) => chart.chartName === 'rancher-monitoring');

          expect(monitoringChart.values.prometheus).to.deep.equal(prometheusSpec.values.prometheus);
        });
      });
    });

    describe('Grafana resource configuration', () => {
      beforeEach(() => {
        cy.login();
        chartsPage.goTo();
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
        chartsPage.goToInstall().nextPage().editOptions(tabbedOptions, '[data-testid="btn-grafana"');

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
        chartsPage.editYaml();

        chartsPage.installChart();

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
