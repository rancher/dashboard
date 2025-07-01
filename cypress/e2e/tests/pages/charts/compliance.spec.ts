import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { MEDIUM_TIMEOUT_OPT, LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import { CompliancePo, ComplianceListPo } from '~/cypress/e2e/po/other-products/compliance.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';

describe('Charts', { testIsolation: 'off', tags: ['@charts', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  describe('Compliance install', () => {
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();

    describe('YAML view', () => {
      beforeEach(() => {
        ChartPage.navTo(null, 'Rancher Compliance');
        chartPage.waitForChartHeader('Rancher Compliance', MEDIUM_TIMEOUT_OPT);
        chartPage.goToInstall();
        installChartPage.nextPage().editYaml();
      });

      describe('UI Elements', () => {
        it('Footer controls should sticky to bottom', () => {
          cy.get('#wizard-footer-controls').should('be.visible');

          cy.get('#wizard-footer-controls').then(($el) => {
            const elementRect = $el[0].getBoundingClientRect();
            const viewportHeight = Cypress.config('viewportHeight');
            const pageHeight = Cypress.$(cy.state('window')).height();

            expect(elementRect.bottom).to.eq(pageHeight);
            expect(elementRect.bottom).to.eq(viewportHeight);
          });
        });
      });
    });

    describe('Compliance Chart setup', () => {
      it('Complete install and a Scan is created', () => {
        cy.updateNamespaceFilter('local', 'none', '{"local":[]}');
        const kubectl = new Kubectl();
        const compliance = new CompliancePo();
        const complianceList = new ComplianceListPo();
        const sideNav = new ProductNavPo();
        const terminal = new Kubectl();

        ChartPage.navTo(null, 'Rancher Compliance');
        chartPage.waitForChartHeader('Rancher Compliance', MEDIUM_TIMEOUT_OPT);
        chartPage.goToInstall();

        installChartPage.nextPage();

        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
        installChartPage.installChart();
        cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
        kubectl.waitForTerminalStatus('Disconnected');

        kubectl.closeTerminal();

        sideNav.navToSideMenuGroupByLabel('Compliance');
        complianceList.waitForPage();

        // Compliance does not come with any profiles, so create one

        // Open terminal
        terminal.openTerminal(LONG_TIMEOUT_OPT);

        // kubectl commands
        terminal.executeCommand(`apply -f https://raw.githubusercontent.com/rancher/compliance-operator/refs/heads/main/tests/k3s-bench-test.yaml`);

        terminal.closeTerminal();

        complianceList.createScan();
        compliance.waitForPage();
        compliance.cruResource().saveAndWaitForRequests('POST', 'v1/compliance.cattle.io.clusterscans')
          .then(({ response }) => {
            expect(response?.statusCode).to.eq(201);
            expect(response?.body).to.have.property('type', 'compliance.cattle.io.clusterscan');
            expect(response?.body.metadata).to.have.property('name');
            expect(response?.body.metadata).to.have.property('generateName', 'scan-');
          });
        complianceList.waitForPage();
        complianceList.checkVisible();
        const column = complianceList.firstRow().column(1);

        column.get('.bg-success', LONG_TIMEOUT_OPT).should('exist');
      });

      after('clean up', () => {
        const chartNamespace = 'rancher-compliance-system';
        const chartApp = 'rancher-compliance';
        const chartCrd = 'rancher-compliance-crd';

        cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}');
        cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}');
        cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
      });
    });
  });
});
