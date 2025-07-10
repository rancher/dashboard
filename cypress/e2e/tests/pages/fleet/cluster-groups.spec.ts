import { FleetClusterGroupsCreateEditPo, FleetClusterGroupsListPagePo, FleetClusterGroupDetailsPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.clustergroup.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

describe('Cluster Groups', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetClusterGroupsListPage = new FleetClusterGroupsListPagePo();

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
    const fleetCreateEditClusterGroupPage = new FleetClusterGroupsCreateEditPo();

    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroupsListPage.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
    fleetClusterGroupsListPage.baseResourceList().masthead().create();
    fleetCreateEditClusterGroupPage.waitForPage();

    fleetCreateEditClusterGroupPage.resourceDetail().createEditView()
      .nameNsDescription()
      .name()
      .set(clusterGroupName);
    fleetCreateEditClusterGroupPage.resourceDetail().cruResource()
      .saveOrCreate()
      .click()
      .then(() => {
        removeClusterGroups = true;
        clusterGroupsToDelete.push(`${ localWorkspace }/${ clusterGroupName }`);
      });

    fleetClusterGroupsListPage.waitForPage();
    fleetClusterGroupsListPage.resourceTableDetails(clusterGroupName, 1).should('be.visible');
  });

  it('can edit a cluster group', () => {
    const fleetCreateEditClusterGroupPage = new FleetClusterGroupsCreateEditPo(localWorkspace, clusterGroupName);

    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroupsListPage.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
    fleetClusterGroupsListPage.list().actionMenu(clusterGroupName).getMenuItem('Edit Config')
      .click();
    fleetCreateEditClusterGroupPage.waitForPage('mode=edit');
    fleetCreateEditClusterGroupPage.resourceDetail().createEditView()
      .nameNsDescription()
      .description()
      .set(`${ clusterGroupName }-fleet-desc`);
    fleetCreateEditClusterGroupPage.resourceDetail().cruResource()
      .saveAndWaitForRequests('PUT', `v1/fleet.cattle.io.clustergroups/${ localWorkspace }/${ clusterGroupName }`)
      .then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.metadata).to.have.property('name', clusterGroupName);
        expect(response?.body.metadata.annotations).to.have.property('field.cattle.io/description', `${ clusterGroupName }-fleet-desc`);
      });
    fleetClusterGroupsListPage.waitForPage();
  });

  it('can clone a cluster group', () => {
    const fleetCreateEditClusterGroupPage = new FleetClusterGroupsCreateEditPo(localWorkspace, clusterGroupName);

    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroupsListPage.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
    fleetClusterGroupsListPage.list().actionMenu(clusterGroupName).getMenuItem('Clone')
      .click();
    fleetCreateEditClusterGroupPage.waitForPage('mode=clone');
    fleetCreateEditClusterGroupPage.resourceDetail().createEditView()
      .nameNsDescription()
      .name()
      .set(`clone-${ clusterGroupName }`);
    fleetCreateEditClusterGroupPage.resourceDetail().createEditView()
      .nameNsDescription()
      .description()
      .set(`${ clusterGroupName }-fleet-desc`);
    fleetCreateEditClusterGroupPage.resourceDetail().cruResource()
      .saveAndWaitForRequests('POST', 'v1/fleet.cattle.io.clustergroups')
      .then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
        removeClusterGroups = true;
        clusterGroupsToDelete.push(`${ localWorkspace }/clone-${ clusterGroupName }`);
        expect(response?.body.metadata).to.have.property('name', `clone-${ clusterGroupName }`);
        expect(response?.body.metadata.annotations).to.have.property('field.cattle.io/description', `${ clusterGroupName }-fleet-desc`);
      });
    fleetClusterGroupsListPage.waitForPage();
    fleetClusterGroupsListPage.resourceTableDetails(`clone-${ clusterGroupName }`, 1).should('be.visible');
  });

  it('can delete cluster group', () => {
    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroupsListPage.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
    fleetClusterGroupsListPage.list().actionMenu(clusterGroupName).getMenuItem('Delete')
      .click();
    fleetClusterGroupsListPage.list().resourceTable().sortableTable()
      .rowNames('.col-link-detail')
      .then((rows: any) => {
        const promptRemove = new PromptRemove();

        cy.intercept('DELETE', `v1/fleet.cattle.io.clustergroups/${ localWorkspace }/clone-${ clusterGroupName }`).as('deleteClusterGroup');

        promptRemove.remove();
        cy.wait('@deleteClusterGroup');
        fleetClusterGroupsListPage.waitForPage();
        fleetClusterGroupsListPage.list().resourceTable().sortableTable()
          .checkRowCount(false, rows.length - 1);
        fleetClusterGroupsListPage.list().resourceTable().sortableTable()
          .rowNames('.col-link-detail')
          .should('not.contain', `clone-${ clusterGroupName }`);
      });
  });

  // testing https://github.com/rancher/dashboard/issues/11687
  it('can open "Edit as YAML"', () => {
    const fleetCreateEditClusterGroupPage = new FleetClusterGroupsCreateEditPo();

    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroupsListPage.waitForPage();
    fleetClusterGroupsListPage.baseResourceList().masthead().create();
    fleetCreateEditClusterGroupPage.resourceDetail().createEditView()
      .editAsYaml();
    fleetCreateEditClusterGroupPage.resourceDetail().resourceYaml()
      .codeMirror()
      .checkExists();
  });

  it('check table headers are available in list and details view', { tags: ['@noVai', '@adminUser'] }, () => {
    const groupName = 'default';

    FleetClusterGroupsListPagePo.navTo();
    fleetClusterGroupsListPage.waitForPage();
    headerPo.selectWorkspace(localWorkspace);
    fleetClusterGroupsListPage.list().rowWithName(groupName).checkVisible();

    // check table headers
    const expectedHeaders = ['State', 'Name', 'Clusters Ready', 'Resources', 'Age'];

    fleetClusterGroupsListPage.list().resourceTable().sortableTable()
      .tableHeaderRow()
      .within('.table-header-container .content')
      .each((el, i) => {
        expect(el.text().trim()).to.eq(expectedHeaders[i]);
      });

    // go to fleet cluster details
    fleetClusterGroupsListPage.goToDetailsPage(groupName);

    const fleetClusterGroupDetailsPage = new FleetClusterGroupDetailsPo(localWorkspace, groupName);

    fleetClusterGroupDetailsPage.waitForPage(null, 'clusters');

    // check table headers
    const expectedHeadersDetailsView = ['State', 'Name', 'Git Repos Ready', 'Helm Ops Ready', 'Bundles Ready', 'Resources', 'Last Seen', 'Age'];

    fleetClusterGroupDetailsPage.clusterList().sortableTable()
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
