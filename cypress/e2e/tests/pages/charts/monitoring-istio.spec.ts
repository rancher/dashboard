/* eslint-disable cypress/no-unnecessary-waiting */
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import CheckboxPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ClusterDashboardPagePo from '@/cypress/e2e/po/pages/explorer/cluster-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

import { prometheusSpec } from '@/cypress/e2e/blueprints/charts/prometheus-chart';

describe('Charts', { tags: ['@charts', '@adminUser'] }, () => {
  const clusterName = 'local';
  const chartsPageUrl = '/c/local/apps/charts/chart?repo-type=cluster&repo=rancher-charts';

  describe('Monitoring', () => {
    // Ideally we should not specify this, older versions can disappear / have issues.
    // However it seems the latest can also have issues (like no matching CRD chart)
    const monitoringVersion = '103.0.3%2Bup45.31.1';
    const chartsMonitoringPage = `${ chartsPageUrl }&chart=rancher-monitoring&version=${ monitoringVersion }`;

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

        // Scroll into view - scroll to bottom of view
        cy.get('.main-layout > .outlet > .outer-container').scrollTo('bottom');

        enableStorageCheckbox.self().should('be.visible');

        enableStorageCheckbox.set();

        // to check custom box element width and height in order to prevent regression
        // https://github.com/rancher/dashboard/issues/10000
        enableStorageCheckbox.hasAppropriateWidth();
        enableStorageCheckbox.hasAppropriateHeight();

        // Scroll into view - scroll to bottom of view
        cy.get('.main-layout > .outlet > .outer-container').scrollTo('bottom');

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

        // Scroll into view - scroll to bottom of view
        cy.get('.main-layout > .outlet > .outer-container').scrollTo('bottom');

        enableStorageCheckbox.self().should('be.visible');

        enableStorageCheckbox.set();

        // Scroll into view - scroll to bottom of view
        cy.get('.main-layout > .outlet > .outer-container').scrollTo('bottom');

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

  /**
   * Istio requires Prometheus operator to be installed, see previous steps.
   */
  describe('Istio', () => {
    const istioVersion = '103.0.0%2Bup1.18.2';
    const chartsIstioPage = `${ chartsPageUrl }&chart=rancher-istio&version=${ istioVersion }`;

    const chartsPage: ChartsPage = new ChartsPage(chartsIstioPage);

    beforeEach(() => {
      cy.login();
    });

    // after(() => {
    //   // Delete istio
    //   cy.createRancherResource('v1', 'catalog.cattle.io.apps/istio-system/rancher-istio?action=uninstall', '');
    // });

    describe('Istio local provisioning', () => {
      it('Should install Istio', () => {
        chartsPage.goTo();
        chartsPage.waitForPage();
        chartsPage.goToInstall().nextPage();

        // Disable Ingress Gateway
        cy.get('[aria-label="Enable Ingress Gateway"]').should('exist');
        cy.get('[aria-label="Enable Ingress Gateway"]').parent().click();

        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
        chartsPage.installChart();
        cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
      });

      it('Side-nav should contain Istio menu item', () => {
        const clusterDashboard = new ClusterDashboardPagePo(clusterName);

        clusterDashboard.goTo();

        const productMenu = new ProductNavPo();

        productMenu.navToSideMenuGroupByLabel('Istio');

        cy.contains('Overview').should('exist');
        cy.contains('Powered by Istio').should('exist');
      });
    });
  });
});
