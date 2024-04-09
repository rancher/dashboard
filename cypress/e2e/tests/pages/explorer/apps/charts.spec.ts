import PagePo from '~/cypress/e2e/po/pages/page.po';

describe('Apps/Repositories', { tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('has the correct title', () => {
    PagePo.goTo('/c/local/apps/charts');

    cy.title().should('eq', 'Rancher - local - Charts');
  });
});
