import { FleetClusterRegistrationTokenListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.clusterregistrationtoken.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { clusterRegistrationTokensNoData, generateclusterRegistrationTokensDataSmall } from '@/cypress/e2e/blueprints/fleet/cluster-registration-tokens-get';

const defaultWorkspace = 'fleet-default';

describe('Cluster Registration Tokens', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetTokensPage = new FleetClusterRegistrationTokenListPagePo();
  const headerPo = new HeaderPo();

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before(() => {
      cy.login();
    });

    it('validate cluster registration tokens table in empty state', () => {
      clusterRegistrationTokensNoData();
      FleetClusterRegistrationTokenListPagePo.navTo();
      fleetTokensPage.waitForPage();
      cy.wait('@clusterRegistrationTokensNoData');

      const expectedHeaders = ['State', 'Name', 'Namespace', 'Secret-Name'];

      fleetTokensPage.tokensList().resourceTable().sortableTable().tableHeaderRow()
        .get('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      fleetTokensPage.tokensList().resourceTable().sortableTable().checkRowCount(true, 1);
    });

    it('validate cluster registration tokens table', () => {
      generateclusterRegistrationTokensDataSmall();
      FleetClusterRegistrationTokenListPagePo.navTo();
      fleetTokensPage.waitForPage();
      headerPo.selectWorkspace(defaultWorkspace);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Namespace', 'Secret-Name'];

      fleetTokensPage.tokensList().resourceTable().sortableTable().tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });
    });
  });
});
