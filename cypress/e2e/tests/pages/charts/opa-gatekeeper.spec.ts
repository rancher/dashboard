/* eslint-disable cypress/no-unnecessary-waiting */
import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';
import { generateOpaGatekeeperForLocalCluster } from '@/cypress/e2e/blueprints/other-products/opa-gatekeeper.js';
import OpaGatekeeperPo from '@/cypress/e2e/po/other-products/opa-gatekeeper';

describe('Charts', { tags: ['@charts', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
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
    const chartsPageUrl = '/c/local/apps/charts/chart?repo-type=cluster&repo=rancher-charts';
    const chartVersion = '102.1.0%2Bup3.12.0';
    const opaGatekeeperPage = `${ chartsPageUrl }&chart=rancher-gatekeeper&${ chartVersion }`;

    const chartsPage: ChartsPage = new ChartsPage(opaGatekeeperPage);

    beforeEach(() => {
      chartsPage.goTo();
    });

    describe('YAML view', () => {
      beforeEach(() => {
        chartsPage.goToInstall().nextPage();
        chartsPage.editYaml();
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
