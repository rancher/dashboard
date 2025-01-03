import { RoleBindingsPagePo } from '@/cypress/e2e/po/pages/explorer/role-bindings.po';
import { generateRoleBindingDataSmall, roleBindingNoData } from '@/cypress/e2e/blueprints/explorer/rbac/role-bindings-get';

const roleBindingsPage = new RoleBindingsPagePo();

describe('RoleBindings', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before('set up', () => {
      cy.updateNamespaceFilter('local', 'none', '{\"local\":[]}');
    });

    it('validate role bindings table in empty state', () => {
      roleBindingNoData();
      roleBindingsPage.goTo();
      roleBindingsPage.waitForPage();
      cy.wait('@roleBindingNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Role', 'Users', 'Groups', 'Service Accounts', 'Age'];

      roleBindingsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      roleBindingsPage.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('flat list: validate role bindings table', () => {
      generateRoleBindingDataSmall();
      roleBindingsPage.goTo();
      roleBindingsPage.waitForPage();
      cy.wait('@roleBindingDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Role', 'Users', 'Groups', 'Service Accounts', 'Age'];

      roleBindingsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      roleBindingsPage.list().resourceTable().sortableTable().checkVisible();
      roleBindingsPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      roleBindingsPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      roleBindingsPage.list().resourceTable().sortableTable().checkRowCount(false, 3);
    });

    it('group by namespace: validate role bindings table', () => {
      generateRoleBindingDataSmall();
      roleBindingsPage.goTo();
      roleBindingsPage.waitForPage();
      cy.wait('@roleBindingDataSmall');

      // group by namespace
      roleBindingsPage.list().resourceTable().sortableTable().groupByButtons(1)
        .click();

      //  check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Role', 'Users', 'Groups', 'Service Accounts', 'Age'];

      roleBindingsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      roleBindingsPage.list().resourceTable().sortableTable().checkVisible();
      roleBindingsPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      roleBindingsPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      roleBindingsPage.list().resourceTable().sortableTable().groupElementWithName('Namespace: kube-system')
        .scrollIntoView()
        .should('be.visible');
      roleBindingsPage.list().resourceTable().sortableTable().checkRowCount(false, 3);
    });

    after('clean up', () => {
      cy.updateNamespaceFilter('local', 'none', '{"local":["all://user"]}');
    });
  });
});
