import { generateOpaGatekeeperForLocalCluster } from '@/cypress/e2e/blueprints/other-products/opa-gatekeeper.js';
import OpaGatekeeperPo from '@/cypress/e2e/po/other-products/opa-gatekeeper';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { InstallChartPage } from '@/cypress/e2e/po/pages/explorer/charts/install-charts.po';

describe('Charts', { testIsolation: 'off', tags: ['@charts', '@adminUser'] }, () => {
  before(() => {
    cy.login();
    HomePagePo.goTo();
  });

  describe('OPA Gatekeeper resources', () => {
    it('should check conditions related to issue #4600 (template w/ create btn + edit constraints w/ save btn)', () => {
      // all intercepts needed to mock install of OPA-Gatekeeper
      generateOpaGatekeeperForLocalCluster();

      const opaGatekeeper = new OpaGatekeeperPo('local');

      opaGatekeeper.goTo();
      opaGatekeeper.waitForPage();

      opaGatekeeper.navToSideMenuEntryByLabel('Template');
      opaGatekeeper.waitForPage();

      opaGatekeeper.createFromYaml().should('exist');

      opaGatekeeper.navToSideMenuEntryByLabel('Constraints');
      opaGatekeeper.waitForPage();

      opaGatekeeper.create().click();
      opaGatekeeper.waitForPage();

      opaGatekeeper.selectContraintSubtype('k8sallowedrepos').click();
      opaGatekeeper.saveCreateForm().expectToBeEnabled();

      opaGatekeeper.navToSideMenuEntryByLabel('Constraints');
      opaGatekeeper.create().click();
      opaGatekeeper.waitForPage();

      opaGatekeeper.selectContraintSubtype('k8srequiredlabels').click();
      opaGatekeeper.saveCreateForm().expectToBeEnabled();
    });
  });

  describe('OPA Gatekeeper install', () => {
    const installChartPage = new InstallChartPage();
    const chartPage = new ChartPage();

    describe('YAML view', () => {
      beforeEach(() => {
        ChartPage.navTo(null, 'OPA Gatekeeper');
        chartPage.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-gatekeeper');
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
  });
});
