import PagePo from '@/cypress/e2e/po/pages/page.po';

describe('Global Settings Index', { testIsolation: 'off', tags: ['@globalSettings', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('can redirect', () => {
    const page = new PagePo('/c/local/settings');

    page.goTo();

    cy.url().should('includes', `${ Cypress.config().baseUrl }/c/local/settings/management.cattle.io.setting`);
  });
});
