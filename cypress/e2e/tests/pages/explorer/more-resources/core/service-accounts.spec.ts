import { ServiceAccountsPagePo } from '@/cypress/e2e/po/pages/explorer/service-accounts.po';
import { generateServiceAccDataSmall, serviceAccNoData } from '@/cypress/e2e/blueprints/explorer/core/service-accounts-get';

const serviceAccountsPagePo = new ServiceAccountsPagePo();

describe('Service Accounts', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}');
    });

    it('validate services table in empty state', () => {
      serviceAccNoData();
      serviceAccountsPagePo.goTo();
      serviceAccountsPagePo.waitForPage();
      cy.wait('@serviceAccNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Secrets', 'Age'];

      serviceAccountsPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      serviceAccountsPagePo.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('flat list: validate services table', () => {
      generateServiceAccDataSmall();
      serviceAccountsPagePo.goTo();
      serviceAccountsPagePo.waitForPage();
      cy.wait('@serviceAccDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Secrets', 'Age'];

      serviceAccountsPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      serviceAccountsPagePo.list().resourceTable().sortableTable().checkVisible();
      serviceAccountsPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      serviceAccountsPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      serviceAccountsPagePo.list().resourceTable().sortableTable().checkRowCount(false, 3);
    });

    it('group by namespace: validate services table', () => {
      generateServiceAccDataSmall();
      serviceAccountsPagePo.goTo();
      serviceAccountsPagePo.waitForPage();
      cy.wait('@serviceAccDataSmall');

      // group by namespace
      serviceAccountsPagePo.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      //  check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Secrets', 'Age'];

      serviceAccountsPagePo.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      serviceAccountsPagePo.list().resourceTable().sortableTable().checkVisible();
      serviceAccountsPagePo.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      serviceAccountsPagePo.list().resourceTable().sortableTable().noRowsShouldNotExist();
      serviceAccountsPagePo.list().resourceTable().sortableTable().groupElementWithName('Namespace: cattle-system')
        .scrollIntoView()
        .should('be.visible');
      serviceAccountsPagePo.list().resourceTable().sortableTable().checkRowCount(false, 3);
    });

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
