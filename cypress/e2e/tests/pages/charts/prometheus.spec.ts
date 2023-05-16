/* eslint-disable cypress/no-unnecessary-waiting */
import PagePo from '@/cypress/e2e/po/pages/page.po';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import TabbedPo from '@/cypress/e2e/po/components/tabbed.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';
import CheckboxPo from '@/cypress/e2e/po/components/checkbox-input.po';

import { prometheusSpec } from '@/cypress/e2e/tests/pages/data/apps/charts/apps-charts-prometheus-request.ts';

describe('Charts', () => {
  const chartsPageUrl = '/c/local/apps/charts/chart?repo-type=cluster&repo=rancher-charts';

  describe('Monitoring', () => {
    const monitoringVersion = '102.0.1%2Bup40.1.2';
    const chartsMonitoringPage = `${ chartsPageUrl }&chart=rancher-monitoring&${ monitoringVersion }`;

    const chartsPage: ChartsPage = new ChartsPage(chartsMonitoringPage);

    let installButton: AsyncButtonPo;
    let nextButton: AsyncButtonPo;

    before(() => {
      cy.login();
      chartsPage.goTo();
    });

    describe('Promethus local provisioner config', () => {
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
      });

      // Don't actually install the chart
      const mockSuccessResponse = {
        statusCode: 200,
        body:       { message: 'Success' }
      };

      beforeEach(() => {
        installButton = new AsyncButtonPo('[data-testid="btn-install"]');
        nextButton = new AsyncButtonPo('[data-testid="btn-next"]');

        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install', mockSuccessResponse).as('prometheusChartCreation');
      });

      it('Should not include empty prometheus selector when installing.', () => {
        const tabbedOptions = new TabbedPo();

        // Set prometheus storage class
        chartsPage.goToInstall().nextPage().editOptions(tabbedOptions, '[data-testid="btn-prometheus"');

        const enableStorageCheckbox = new CheckboxPo('[data-testid="checkbox-chart-enable-persistent-storage"]');

        enableStorageCheckbox.set();

        const labeledSelectPo = new LabeledSelectPo('[data-testid="select-chart-prometheus-storage-class"]');

        labeledSelectPo.toggle();
        labeledSelectPo.clickOptionWithLabel('local-path');

        // Click on YAML. In YAML mode, the prometheus selector is present but empty
        // It should not be sent to the API
        chartsPage.editYaml();

        chartsPage.installChart();

        cy.wait('@prometheusChartCreation', { requestTimeout: 10000 }).then((req) => {
          console.log('BODY', req.request?.body);
          const monitoringChart = req.request?.body.charts.find((chart: any) => chart.chartName === 'rancher-monitoring');

          console.log(monitoringChart.values.prometheus.prometheusSpec);
          expect(monitoringChart.values.prometheus).to.deep.equal(prometheusSpec.values.prometheus);
        });
      });
    });
  });
});
