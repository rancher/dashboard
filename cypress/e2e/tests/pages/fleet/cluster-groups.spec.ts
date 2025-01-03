import { FleetClusterGroupsListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.clustergroup.po';
import FleetClusterGroupDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.clustergroup.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';

describe('Cluster Groups', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetClusterGroups = new FleetClusterGroupsListPagePo();
  const headerPo = new HeaderPo();

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    before(() => {
      cy.login();
    });

    it('check table headers are available in list and details view', () => {
      const groupName = 'default';
      const workspace = 'fleet-local';

      FleetClusterGroupsListPagePo.navTo();
      fleetClusterGroups.waitForPage();
      headerPo.selectWorkspace(workspace);
      fleetClusterGroups.clusterGroupsList().rowWithName(groupName).checkVisible();

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Clusters Ready', 'Resources', 'Age'];

      fleetClusterGroups.clusterGroupsList().resourceTable().sortableTable().tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      // go to fleet cluster details
      fleetClusterGroups.goToDetailsPage(groupName);

      const fleetClusterGroupDetailsPage = new FleetClusterGroupDetailsPo(workspace, groupName);

      fleetClusterGroupDetailsPage.waitForPage(null, 'clusters');

      // check table headers
      const expectedHeadersDetailsView = ['State', 'Name', 'Bundles Ready', 'Repos Ready', 'Resources', 'Last Seen', 'Age'];

      fleetClusterGroupDetailsPage.clusterList().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeadersDetailsView[i]);
        });
    });
  });
  describe('Edit', { tags: ['@vai', '@adminUser'] }, () => {
    before(() => {
      cy.login();
    });

    it('can open "Edit as YAML"', () => {
      FleetClusterGroupsListPagePo.navTo();
      fleetClusterGroups.waitForPage();
      fleetClusterGroups.clickCreate();
      fleetClusterGroups.createFleetClusterGroupsForm().editAsYaml().click();
      fleetClusterGroups.createFleetClusterGroupsForm().yamlEditor().checkExists();
    });
  });
});
