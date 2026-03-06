import { SecretsListPagePo } from '@/cypress/e2e/po/pages/explorer/secrets.po';

const secretsListPage = new SecretsListPagePo('local');

describe('Secrets', { testIsolation: 'off', tags: ['@explorer2', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('has the correct title', () => {
    secretsListPage.goTo();
    secretsListPage.title().should('include', 'Secrets');

    cy.title().should('eq', 'Rancher - local - Secrets');
  });

  it('displays the list of secrets and has a create button', () => {
    secretsListPage.goTo();
    secretsListPage.waitForPage();

    // Check create button
    secretsListPage.createButtonTitle().should('eq', 'Create');

    // Check that the table is present
    secretsListPage.list().checkVisible();
  });
});
