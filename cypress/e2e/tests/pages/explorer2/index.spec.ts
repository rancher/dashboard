import PagePo from '@/cypress/e2e/po/pages/page.po';
import { qase } from '@/cypress/support/qase';

describe('Explorer Index', { testIsolation: false, tags: ['@explorer2', '@adminUser', '@standardUser'] }, () => {
  before(() => {
    cy.login();
  });

  qase(3284, it('can redirect', () => {
    const page = new PagePo('/c/local/');

    page.goTo();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/explorer`);
  }));
});
