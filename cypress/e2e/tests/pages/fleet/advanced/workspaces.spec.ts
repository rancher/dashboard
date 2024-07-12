import { FleetWorkspaceListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.fleetworkspace.po';
import FleetWorkspaceDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.fleetworkspace.po';
import { generateFleetWorkspacesDataSmall } from '@/cypress/e2e/blueprints/fleet/workspaces-get';

const defaultWorkspace = 'fleet-default';
const workspaceNameList = [];

describe('Workspaces', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetWorkspacesPage = new FleetWorkspaceListPagePo();

  before(() => {
    cy.login();
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    it('check table headers are available in list and details view', () => {
      FleetWorkspaceListPagePo.navTo();
      fleetWorkspacesPage.waitForPage();
      fleetWorkspacesPage.sortableTable().noRowsShouldNotExist();
      fleetWorkspacesPage.sortableTable().filter(defaultWorkspace);
      fleetWorkspacesPage.sortableTable().checkRowCount(false, 1);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Git Repos', 'Clusters', 'Cluster Groups', 'Age'];

      fleetWorkspacesPage.workspacesList().resourceTable().sortableTable().tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      // go to fleet workspaces details
      fleetWorkspacesPage.goToDetailsPage(defaultWorkspace);

      const fleetWorkspaceDetailsPage = new FleetWorkspaceDetailsPo(defaultWorkspace);

      fleetWorkspaceDetailsPage.waitForPage(null, 'events');

      // check table headers
      const expectedHeadersDetailsViewEvents = ['Type', 'Reason', 'Updated', 'Message'];

      fleetWorkspaceDetailsPage.recentEventsList().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeadersDetailsViewEvents[i]);
        });

      fleetWorkspaceDetailsPage.workspaceTabs().clickTabWithSelector('[data-testid="related"]');
      fleetWorkspaceDetailsPage.waitForPage(null, 'related');

      // check table headers
      const expectedHeadersDetailsViewResources = ['State', 'Type', 'Name', 'Namespace'];

      fleetWorkspaceDetailsPage.relatedResourcesList(1).resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeadersDetailsViewResources[i]);
        });

      fleetWorkspaceDetailsPage.relatedResourcesList(2).resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeadersDetailsViewResources[i]);
        });
    });

    const uniqueWorkspaceName = 'aaa-e2e-test-name';

    before('set up', () => {
      // create workspaces
      let i = 0;

      while (i < 100) {
        const workspaceName = `e2e-${ Cypress._.uniqueId(Date.now().toString()) }`;
        const workspaceDesc = `e2e-desc-${ Cypress._.uniqueId(Date.now().toString()) }`;

        cy.createFleetWorkspace(workspaceName, workspaceDesc, false).then((resp: Cypress.Response<any>) => {
          const wsId = resp.body.id;

          workspaceNameList.push(wsId);
        });

        i++;
      }

      // create one more for sorting test
      cy.createFleetWorkspace(uniqueWorkspaceName).then((resp: Cypress.Response<any>) => {
        const wsId = resp.body.id;

        workspaceNameList.push(wsId);
      });
    });

    it('pagination is visible and user is able to navigate through workspace data', () => {
      // get fleet workspace count
      cy.getRancherResource('v1', 'management.cattle.io.fleetworkspaces').then((resp: Cypress.Response<any>) => {
        const count = resp.body.count;

        FleetWorkspaceListPagePo.navTo();
        fleetWorkspacesPage.waitForPage();

        // pagination is visible
        fleetWorkspacesPage.sortableTable().pagination().checkVisible();

        // basic checks on navigation buttons
        fleetWorkspacesPage.sortableTable().pagination().beginningButton().isDisabled();
        fleetWorkspacesPage.sortableTable().pagination().leftButton().isDisabled();
        fleetWorkspacesPage.sortableTable().pagination().rightButton().isEnabled();
        fleetWorkspacesPage.sortableTable().pagination().endButton().isEnabled();

        // check text before navigation
        fleetWorkspacesPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 100 of ${ count } Workspaces`);
        });

        // navigate to next page - right button
        fleetWorkspacesPage.sortableTable().pagination().rightButton().click();

        // check text and buttons after navigation
        fleetWorkspacesPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`101 - ${ count } of ${ count } Workspaces`);
        });
        fleetWorkspacesPage.sortableTable().pagination().beginningButton().isEnabled();
        fleetWorkspacesPage.sortableTable().pagination().leftButton().isEnabled();

        // navigate to first page - left button
        fleetWorkspacesPage.sortableTable().pagination().leftButton().click();

        // check text and buttons after navigation
        fleetWorkspacesPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 100 of ${ count } Workspaces`);
        });
        fleetWorkspacesPage.sortableTable().pagination().beginningButton().isDisabled();
        fleetWorkspacesPage.sortableTable().pagination().leftButton().isDisabled();

        // navigate to last page - end button
        fleetWorkspacesPage.sortableTable().pagination().endButton().click();

        // check row count on last page
        fleetWorkspacesPage.sortableTable().checkRowCount(false, count - 100);

        // check text after navigation
        fleetWorkspacesPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`101 - ${ count } of ${ count } Workspaces`);
        });

        // navigate to first page - beginning button
        fleetWorkspacesPage.sortableTable().pagination().beginningButton().click();

        // check text and buttons after navigation
        fleetWorkspacesPage.sortableTable().pagination().paginationText().then((el) => {
          expect(el.trim()).to.eq(`1 - 100 of ${ count } Workspaces`);
        });
        fleetWorkspacesPage.sortableTable().pagination().beginningButton().isDisabled();
        fleetWorkspacesPage.sortableTable().pagination().leftButton().isDisabled();
      });
    });

    it('filter workspace', () => {
      FleetWorkspaceListPagePo.navTo();
      fleetWorkspacesPage.waitForPage();

      fleetWorkspacesPage.sortableTable().checkVisible();
      fleetWorkspacesPage.sortableTable().checkLoadingIndicatorNotVisible();
      fleetWorkspacesPage.sortableTable().checkRowCount(false, 100);

      // filter by name
      fleetWorkspacesPage.sortableTable().filter(workspaceNameList[0]);
      fleetWorkspacesPage.sortableTable().checkRowCount(false, 1);
      fleetWorkspacesPage.sortableTable().rowElementWithName(workspaceNameList[0]).scrollIntoView().should('be.visible');
      fleetWorkspacesPage.sortableTable().resetFilter();
    });

    it('sorting changes the order of paginated workspace data', () => {
      FleetWorkspaceListPagePo.navTo();
      fleetWorkspacesPage.waitForPage();

      // check table is sorted by access key in ASC order by default
      fleetWorkspacesPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'down');

      // workspace name should be visible on first page (sorted in ASC order)
      fleetWorkspacesPage.sortableTable().rowElementWithName(uniqueWorkspaceName).scrollIntoView().should('be.visible');

      // navigate to last page
      fleetWorkspacesPage.sortableTable().pagination().endButton().click();

      // workspace name should be NOT visible on last page (sorted in ASC order)
      fleetWorkspacesPage.sortableTable().rowElementWithName(uniqueWorkspaceName).should('not.exist');

      // sort by name in DESC order
      fleetWorkspacesPage.sortableTable().sort(2).click();
      fleetWorkspacesPage.sortableTable().tableHeaderRow().checkSortOrder(2, 'up');

      // workspace name should be NOT visible on first page (sorted in DESC order)
      fleetWorkspacesPage.sortableTable().rowElementWithName(uniqueWorkspaceName).should('not.exist');

      // navigate to last page
      fleetWorkspacesPage.sortableTable().pagination().endButton().click();

      // workspace name should be visible on last page (sorted in DESC order)
      fleetWorkspacesPage.sortableTable().rowElementWithName(uniqueWorkspaceName).scrollIntoView().should('be.visible');
    });

    it('pagination is hidden', () => {
      generateFleetWorkspacesDataSmall();
      fleetWorkspacesPage.goTo();
      fleetWorkspacesPage.waitForPage();
      cy.wait('@fleetworkspacesDataSmall');

      fleetWorkspacesPage.sortableTable().checkVisible();
      fleetWorkspacesPage.sortableTable().checkLoadingIndicatorNotVisible();
      fleetWorkspacesPage.sortableTable().checkRowCount(false, 2);
      fleetWorkspacesPage.sortableTable().pagination().checkNotExists();
    });

    after(() => {
      workspaceNameList.forEach((r) => cy.deleteRancherResource('v3', 'fleetWorkspaces', r, false));
    });
  });
});
