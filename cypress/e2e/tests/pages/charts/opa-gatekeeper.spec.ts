/* eslint-disable cypress/no-unnecessary-waiting */
import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';

describe('Charts', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('OPA Gatekeeper', () => {
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
