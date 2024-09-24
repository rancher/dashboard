import { clusterRoleBindingNoData, generateClusterRoleBindingDataSmall } from '@/cypress/e2e/blueprints/explorer/rbac/cluster-role-bindings-get';
import { ClusterRoleBindingsPagePo } from '@/cypress/e2e/po/pages/explorer/cluster-role-bindings.po';

const clusterRoleBindingsPage = new ClusterRoleBindingsPagePo();

describe('ClusterRoleBindings', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    it('validate cluster role bindings table in empty state', () => {
      clusterRoleBindingNoData();
      clusterRoleBindingsPage.goTo();
      clusterRoleBindingsPage.waitForPage();
      cy.wait('@clusterRoleBindingNoData');

      const expectedHeaders = ['State', 'Name', 'Role', 'Users', 'Groups', 'Service Accounts', 'Age'];

      clusterRoleBindingsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      clusterRoleBindingsPage.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('validate cluster role bindings table', () => {
      generateClusterRoleBindingDataSmall();
      clusterRoleBindingsPage.goTo();
      clusterRoleBindingsPage.waitForPage();
      cy.wait('@clusterRoleBindingDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Role', 'Users', 'Groups', 'Service Accounts', 'Age'];

      clusterRoleBindingsPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      clusterRoleBindingsPage.list().resourceTable().sortableTable().checkVisible();
      clusterRoleBindingsPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      clusterRoleBindingsPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      clusterRoleBindingsPage.list().resourceTable().sortableTable().checkRowCount(false, 2);
    });
  });
});
