import PagePo from '@/cypress/e2e/po/pages/page.po';
import { qase } from '@/cypress/support/qase';

describe('Apps Index', { testIsolation: false, tags: ['@explorer', '@adminUser', '@standardUser'] }, () => {
  before(() => {
    cy.login();
  });

  qase(3286, it('can redirect', () => {
    const page = new PagePo('/c/local/apps');

    page.goTo();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/apps/charts`);
  }));
});
