import { LeasesPagePo } from '@/cypress/e2e/po/pages/explorer/coordination.k8s.io.lease';

const leasesPage = new LeasesPagePo();

describe('No Custom Form Resource', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });

    it(`can create a resource using the 'Create from YAML' button`, () => {
      leasesPage.goTo();
      leasesPage.waitForPage();

      leasesPage.clickCreateYaml();

      cy.get('[data-testid="action-button-async-button"]').click();

      leasesPage.waitForPage();
      leasesPage.list().resourceTable().sortableTable().rowNames()
        .then((names) => {
          expect(names).to.have.length.greaterThan(0);
        });
    });
  });
});
