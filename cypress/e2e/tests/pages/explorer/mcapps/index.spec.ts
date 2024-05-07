import PagePo from '@/cypress/e2e/po/pages/page.po';

describe('MCApps Index', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('can redirect', () => {
    const page = new PagePo('/c/local/mcapps');

    page.goTo();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/mcapps/pages/catalogs`);
  });
});
