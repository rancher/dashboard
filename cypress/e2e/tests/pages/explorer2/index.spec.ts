import PagePo from '@/cypress/e2e/po/pages/page.po';

describe('Explorer Index', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('can redirect', () => {
    const page = new PagePo('/c/local/');

    page.goTo();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/explorer`);
  });
});
