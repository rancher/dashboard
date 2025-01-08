import { FleetClusterGroupsListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.clustergroup.po';
import FleetClusterGroupDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.clustergroup.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

describe('Cluster Groups', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetClusterGroups = new FleetClusterGroupsListPagePo();
  const headerPo = new HeaderPo();
  const localWorkspace = 'fleet-local';
  let clusterGroupName;
  let removeClusterGroups = false;
  const clusterGroupsToDelete = [];

  before(() => {
    cy.login();
    cy.createE2EResourceName('cluster-group').then((name) => {
      clusterGroupName = name;
    });
  });

  it('can create cluster group', () => {
    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroups.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
    fleetClusterGroups.clickCreate();
    fleetClusterGroups.createFleetClusterGroupsForm().waitForPage();

    fleetClusterGroups.createFleetClusterGroupsForm().nameNsDescription().name().set(clusterGroupName);
    fleetClusterGroups.createFleetClusterGroupsForm().saveCreateForm().cruResource().saveOrCreate()
      .click()
      .then(() => {
        removeClusterGroups = true;
        clusterGroupsToDelete.push(`${ localWorkspace }/${ clusterGroupName }`);
      });

    fleetClusterGroups.waitForPage();
    fleetClusterGroups.clusterGroupsList().details(clusterGroupName, 1).should('be.visible');
  });

  it('can edit a cluster group', () => {
    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroups.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
    fleetClusterGroups.clusterGroupsList().actionMenu(clusterGroupName).getMenuItem('Edit Config').click();
    fleetClusterGroups.createFleetClusterGroupsForm(localWorkspace, clusterGroupName).waitForPage('mode=edit');
    fleetClusterGroups.createFleetClusterGroupsForm().nameNsDescription().description().set(`${ clusterGroupName }-fleet-desc`);
    fleetClusterGroups.createFleetClusterGroupsForm().saveCreateForm().cruResource().saveAndWaitForRequests('PUT', `v1/fleet.cattle.io.clustergroups/${ localWorkspace }/${ clusterGroupName }`)
      .then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.metadata).to.have.property('name', clusterGroupName);
        expect(response?.body.metadata.annotations).to.have.property('field.cattle.io/description', `${ clusterGroupName }-fleet-desc`);
      });
    fleetClusterGroups.waitForPage();
  });

  it('can clone a cluster group', () => {
    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroups.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
    fleetClusterGroups.clusterGroupsList().actionMenu(clusterGroupName).getMenuItem('Clone').click();
    fleetClusterGroups.createFleetClusterGroupsForm(localWorkspace, clusterGroupName).waitForPage('mode=clone');
    fleetClusterGroups.createFleetClusterGroupsForm().nameNsDescription().name().set(`clone-${ clusterGroupName }`);
    fleetClusterGroups.createFleetClusterGroupsForm().nameNsDescription().description().set(`${ clusterGroupName }-fleet-desc`);
    fleetClusterGroups.createFleetClusterGroupsForm().saveCreateForm().cruResource().saveAndWaitForRequests('POST', 'v1/fleet.cattle.io.clustergroups')
      .then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeClusterGroups = true;
        clusterGroupsToDelete.push(`${ localWorkspace }/clone-${ clusterGroupName }`);
        expect(response?.body.metadata).to.have.property('name', `clone-${ clusterGroupName }`);
        expect(response?.body.metadata.annotations).to.have.property('field.cattle.io/description', `${ clusterGroupName }-fleet-desc`);
      });
    fleetClusterGroups.waitForPage();
    fleetClusterGroups.clusterGroupsList().details(`clone-${ clusterGroupName }`, 1).should('be.visible');
  });

  it('can delete cluster group', () => {
    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroups.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
    fleetClusterGroups.clusterGroupsList().actionMenu(clusterGroupName).getMenuItem('Delete').click();
    fleetClusterGroups.clusterGroupsList().resourceTable().sortableTable().rowNames('.col-link-detail')
      .then((rows: any) => {
        const promptRemove = new PromptRemove();

        cy.intercept('DELETE', `v1/fleet.cattle.io.clustergroups/${ localWorkspace }/clone-${ clusterGroupName }`).as('deleteClusterGroup');

        promptRemove.remove();
        cy.wait('@deleteClusterGroup');
        fleetClusterGroups.waitForPage();
        fleetClusterGroups.clusterGroupsList().resourceTable().sortableTable().checkRowCount(false, rows.length - 1);
        fleetClusterGroups.clusterGroupsList().resourceTable().sortableTable().rowNames('.col-link-detail')
          .should('not.contain', `clone-${ clusterGroupName }`);
      });
  });

  // testing https://github.com/rancher/dashboard/issues/11687
  it('can open "Edit as YAML"', () => {
    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroups.waitForPage();
    fleetClusterGroups.clickCreate();
    fleetClusterGroups.createFleetClusterGroupsForm().saveCreateForm().createEditView().editAsYaml();
    fleetClusterGroups.createFleetClusterGroupsForm().saveCreateForm().resourceYaml().codeMirror()
      .checkExists();
  });

  it('check table headers are available in list and details view', { tags: ['@vai', '@adminUser'] }, () => {
    const groupName = 'default';

    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroups.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
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

    const fleetClusterGroupDetailsPage = new FleetClusterGroupDetailsPo(localWorkspace, groupName);

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

  after(() => {
    if (removeClusterGroups) {
      // delete gitrepo
      clusterGroupsToDelete.forEach((r) => cy.deleteRancherResource('v1', 'fleet.cattle.io.clustergroups', r, false));
    }
  });
});
