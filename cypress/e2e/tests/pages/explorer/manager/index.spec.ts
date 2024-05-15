import PagePo from '@/cypress/e2e/po/pages/page.po';

describe('Manager Index', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('can redirect', () => {
    const page = new PagePo('/c/local/manager');

    page.goTo();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/manager/provisioning.cattle.io.cluster`);
  });
});
