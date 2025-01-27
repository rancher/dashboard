import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import { MEDIUM_TIMEOUT_OPT, LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import Kubectl from '@/cypress/e2e/po/components/kubectl.po';
import CisBenchmarkPo from '@/cypress/e2e/po/other-products/cis-benchmark.po';

describe('Charts', { testIsolation: 'off', tags: ['@charts', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  describe('CIS Benchmark install', () => {
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();

    describe('YAML view', () => {
      beforeEach(() => {
        ChartPage.navTo(null, 'CIS Benchmark');
        chartPage.waitForChartHeader('CIS Benchmark', MEDIUM_TIMEOUT_OPT);
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

    describe('CIS Chart setup', () => {
      it('Complete install and a Scan is created', () => {
        cy.updateNamespaceFilter('local', 'none', '{"local":[]}');
        const kubectl = new Kubectl();
        const sideNav = new ProductNavPo();
        const cisBenchmark = new CisBenchmarkPo();

        ChartPage.navTo(null, 'CIS Benchmark');
        chartPage.waitForChartHeader('CIS Benchmark', MEDIUM_TIMEOUT_OPT);
        chartPage.goToInstall();

        installChartPage.nextPage();

        cy.intercept('POST', 'v1/catalog.cattle.io.clusterrepos/rancher-charts?action=install').as('chartInstall');
        installChartPage.installChart();
        cy.wait('@chartInstall').its('response.statusCode').should('eq', 201);
        cy.contains('Disconnected');

        kubectl.closeTerminal();

        sideNav.navToSideMenuGroupByLabel('CIS Benchmark');
        sideNav.navToSideMenuEntryByLabel('Scan');

        cisBenchmark.create().click();
        cisBenchmark.saveCreateForm().click();
        cisBenchmark.list().checkVisible();
        const column = cisBenchmark.list().resourceTable().sortableTable().row(0)
          .column(1);

        column.get('.bg-success', LONG_TIMEOUT_OPT).should('exist');
      });

      after('clean up', () => {
        const chartNamespace = 'cis-operator-system';
        const chartApp = 'rancher-cis-benchmark';
        const chartCrd = 'rancher-cis-benchmark-crd';

        cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartApp }?action=uninstall`, '{}');
        cy.createRancherResource('v1', `catalog.cattle.io.apps/${ chartNamespace }/${ chartCrd }?action=uninstall`, '{}');
        cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
      });
    });
  });
});
