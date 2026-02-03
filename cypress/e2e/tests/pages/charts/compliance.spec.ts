import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import { MEDIUM_TIMEOUT_OPT, LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import { CompliancePo, ComplianceListPo } from '~/cypress/e2e/po/other-products/compliance.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import ChartInstalledAppsListPagePo from '@/cypress/e2e/po/pages/chart-installed-apps.po';

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
        const compliance = new CompliancePo();
        const complianceList = new ComplianceListPo();
        const sideNav = new ProductNavPo();
        const terminal = new Kubectl();
        const installedAppsPage = new ChartInstalledAppsListPagePo('local', 'apps');

        // Add API intercept before navigating to chart to ensure we catch the install request
        cy.intercept('POST', '/v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('complianceInstall');

        ChartPage.navTo(null, 'Rancher Compliance');
        chartPage.waitForChartHeader('Rancher Compliance', MEDIUM_TIMEOUT_OPT);
        chartPage.goToInstall();

        installChartPage.nextPage();
        installChartPage.installChart();

        // Wait for installation request to complete - increased timeout for chart installation
        cy.wait('@complianceInstall', { timeout: 30000 }).its('response.statusCode').should('eq', 201);

        // Wait for terminal to disconnect indicating installation is complete
        terminal.waitForTerminalStatus('Disconnected', LONG_TIMEOUT_OPT);
        terminal.closeTerminal();

        // Verify apps are deployed
        installedAppsPage.appsList().resourceTableDetails('rancher-compliance', 1).should('contain', 'Deployed');
        installedAppsPage.appsList().resourceTableDetails('rancher-compliance-crd', 1).should('contain', 'Deployed');

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

        complianceList.list().resourceTable().checkVisible();
        complianceList.list().resourceTable().sortableTable().checkRowCount(false, 2);
      });

      after('clean up', () => {
        const chartNamespace = 'compliance-operator-system';
        const chartApp = 'rancher-compliance';
        const chartCrd = 'rancher-compliance-crd';

        cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}');
        cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}');
        cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
      });
    });
  });
});
