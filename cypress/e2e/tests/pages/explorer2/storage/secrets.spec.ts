import { SecretsListPagePo } from '@/cypress/e2e/po/pages/explorer/secrets.po';
import { qase } from '@/cypress/support/qase';

const secretsListPage = new SecretsListPagePo('local');

describe('Secrets', { testIsolation: false, tags: ['@explorer2', '@adminUser', '@standardUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  qase(9688, it('has the correct title', () => {
    secretsListPage.goTo();
    secretsListPage.title().should('include', 'Secrets');

    cy.getRancherVersion().then((version) => {
      const expectedTitle = version.RancherPrime === 'true' ? 'Rancher Prime - local - Secrets' : 'Rancher - local - Secrets';

      cy.title().should('eq', expectedTitle);
    });
  }));

  qase(27177, it('displays the list of secrets and has a create button', () => {
    secretsListPage.goTo();
    secretsListPage.waitForPage();

    // Check create button
    secretsListPage.createButtonTitle().should('eq', 'Create');

    // Check that the table is present
    secretsListPage.list().checkVisible();
  }));
});
