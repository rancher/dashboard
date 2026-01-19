import PagePo from '@/cypress/e2e/po/pages/page.po';

describe('Auth Index', { testIsolation: 'off', tags: ['@usersAndAuths', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('can redirect', () => {
    const page = new PagePo('/c/local/auth');

    page.goTo();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/auth/management.cattle.io.user`);
  });
});
