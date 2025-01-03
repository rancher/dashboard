import { RolesPagePo } from '@/cypress/e2e/po/pages/explorer/roles.po';
import { generateRolesDataSmall, rolesNoData } from '@/cypress/e2e/blueprints/explorer/rbac/roles-get';

const rolesPage = new RolesPagePo();

describe('Roles', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}');
    });

    it('validate roles table in empty state', () => {
      rolesNoData();
      rolesPage.goTo();
      rolesPage.waitForPage();
      cy.wait('@rolesNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Created At'];

      rolesPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      rolesPage.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('flat list: validate roles table', () => {
      generateRolesDataSmall('rolesDataSmall1');
      rolesPage.goTo();
      rolesPage.waitForPage();
      cy.wait('@rolesDataSmall1');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Created At'];

      rolesPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      rolesPage.list().resourceTable().sortableTable().checkVisible();
      rolesPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      rolesPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      rolesPage.list().resourceTable().sortableTable().checkRowCount(false, 2);
    });

    it('group by namespace: validate roles table', () => {
      const ns = 'saddsfdsf';

      generateRolesDataSmall('rolesDataSmall2', ns);
      rolesPage.goTo();
      rolesPage.waitForPage();
      cy.wait('@rolesDataSmall2');

      // group by namespace
      rolesPage.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      //  check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Created At'];

      rolesPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      rolesPage.list().resourceTable().sortableTable().checkVisible();
      rolesPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      rolesPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      rolesPage.list().resourceTable().sortableTable().groupElementWithName(`Namespace: ${ ns }`)
        .scrollIntoView()
        .should('be.visible');
    });

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
