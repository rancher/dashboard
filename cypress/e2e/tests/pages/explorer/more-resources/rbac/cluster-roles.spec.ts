import { ClusterRolesPagePo } from '@/cypress/e2e/po/pages/explorer/cluster-roles.po';
import { clusterRolesNoData, generateClusterRolesDataSmall } from '@/cypress/e2e/blueprints/explorer/rbac/cluster-roles-get';

const clusterRolesPage = new ClusterRolesPagePo();

describe('ClusterRoles', { testIsolation: 'off', tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    it('validate cluster roles table in empty state', () => {
      clusterRolesNoData();
      clusterRolesPage.goTo();
      clusterRolesPage.waitForPage();
      cy.wait('@clusterRolesNoData');

      const expectedHeaders = ['State', 'Name', 'Created At'];

      clusterRolesPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      clusterRolesPage.list().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('validate cluster roles table', () => {
      generateClusterRolesDataSmall();
      clusterRolesPage.goTo();
      clusterRolesPage.waitForPage();
      cy.wait('@clusterRolesDataSmall');

      // check table headers are visible
      const expectedHeaders = ['State', 'Name', 'Created At'];

      clusterRolesPage.list().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      clusterRolesPage.list().resourceTable().sortableTable().checkVisible();
      clusterRolesPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      clusterRolesPage.list().resourceTable().sortableTable().noRowsShouldNotExist();
      clusterRolesPage.list().resourceTable().sortableTable().checkRowCount(false, 2);
    });
  });
});
