import { FleetWorkspaceListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.fleetworkspace.po';
import FleetWorkspaceDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.fleetworkspace.po';
import { generateFleetWorkspacesDataSmall } from '@/cypress/e2e/blueprints/fleet/workspaces-get';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const defaultWorkspace = 'fleet-default';
const workspaceNameList = [];
let customWorkspace = '';
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Workspaces', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetWorkspacesPage = new FleetWorkspaceListPagePo();
  const headerPo = new HeaderPo();

  before(() => {
    cy.login();
    cy.createE2EResourceName('fleet-workspace').then((name) => {
      customWorkspace = name;
    });
  });

  describe('List', { tags: ['@vai', '@adminUser'] }, () => {
    let initialCount: number;

    it('check table headers are available in list and details view', () => {
      fleetWorkspacesPage.goTo();
      fleetWorkspacesPage.waitForPage();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().noRowsShouldNotExist();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().filter(defaultWorkspace);
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().checkRowCount(false, 1);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Git Repos', 'Clusters', 'Cluster Groups', 'Age'];

      fleetWorkspacesPage.sharedComponents().list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      // go to fleet workspaces details
      fleetWorkspacesPage.sharedComponents().goToDetailsPage(defaultWorkspace);

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

    let uniqueWorkspaceName = SortableTablePo.firstByDefaultName('workspace');

    before('set up', () => {
      cy.getRancherResource('v1', 'management.cattle.io.fleetworkspaces').then((resp: Cypress.Response<any>) => {
        initialCount = resp.body.count;
      });
      // create workspaces
      let i = 0;

      while (i < 25) {
        const workspaceName = Cypress._.uniqueId(Date.now().toString());
        const workspaceDesc = `e2e-desc-${ Cypress._.uniqueId(Date.now().toString()) }`;

        cy.createFleetWorkspace(workspaceName, workspaceDesc, false, { createNameOptions: { prefixContext: true } }).then((resp: Cypress.Response<any>) => {
          const wsId = resp.body.id;

          workspaceNameList.push(wsId);
        });

        i++;
      }

      // create one more for sorting test
      cy.createFleetWorkspace(uniqueWorkspaceName, undefined, true, { createNameOptions: { prefixContext: true } }).then((resp: Cypress.Response<any>) => {
        const wsId = resp.body.id;

        uniqueWorkspaceName = resp.body.name;

        workspaceNameList.push(wsId);
      });
      cy.tableRowsPerPageAndNamespaceFilter(10, 'local', 'none', '{\"local\":[]}');
      cy.reload();
    });

    it('pagination is visible and user is able to navigate through workspace data', () => {
      HomePagePo.goTo();
      const count = initialCount + 26;

      // check fleet workspace count
      cy.waitForRancherResources('v1', 'management.cattle.io.fleetworkspaces', count, false).then((resp: Cypress.Response<any>) => {
        const count = resp.body.count;

        FleetWorkspaceListPagePo.navTo();
        fleetWorkspacesPage.waitForPage();

        // pagination is visible
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .checkVisible();

        // basic checks on navigation buttons
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .rightButton()
          .isEnabled();
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Workspaces`);
          });

        // navigate to next page - right button
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } Workspaces`);
          });
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isEnabled();
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Workspaces`);
          });
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // check row count on last page
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().checkRowCount(false, count - 20);

        // check text after navigation
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`21 - ${ count } of ${ count } Workspaces`);
          });

        // navigate to first page - beginning button
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Workspaces`);
          });
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .beginningButton()
          .isDisabled();
        fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('filter workspace', () => {
      FleetWorkspaceListPagePo.navTo();
      fleetWorkspacesPage.waitForPage();

      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().checkVisible();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().checkRowCount(false, 10);

      // filter by name
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().filter(workspaceNameList[0]);
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().checkRowCount(false, 1);
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().rowElementWithName(workspaceNameList[0])
        .scrollIntoView()
        .should('be.visible');
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().resetFilter();
    });

    it('sorting changes the order of paginated workspace data', () => {
      FleetWorkspaceListPagePo.navTo();
      fleetWorkspacesPage.waitForPage();

      // check table is sorted by access key in ASC order by default
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'down');

      // workspace name should be visible on first page (sorted in ASC order)
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().tableHeaderRow()
        .self()
        .scrollIntoView();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().rowElementWithName(uniqueWorkspaceName)
        .scrollIntoView()
        .should('be.visible');

      // navigate to last page
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // workspace name should be NOT visible on last page (sorted in ASC order)
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().rowElementWithName(uniqueWorkspaceName)
        .should('not.exist');

      // sort by name in DESC order
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().sort(2)
        .click();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().tableHeaderRow()
        .checkSortOrder(2, 'up');

      // workspace name should be NOT visible on first page (sorted in DESC order)
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().rowElementWithName(uniqueWorkspaceName)
        .should('not.exist');

      // navigate to last page
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // workspace name should be visible on last page (sorted in DESC order)
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().rowElementWithName(uniqueWorkspaceName)
        .scrollIntoView()
        .should('be.visible');
    });

    it('pagination is hidden', () => {
      generateFleetWorkspacesDataSmall();
      fleetWorkspacesPage.goTo();
      fleetWorkspacesPage.waitForPage();
      cy.wait('@fleetworkspacesDataSmall');

      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().checkVisible();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().checkRowCount(false, 2);
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().pagination()
        .checkNotExists();
    });

    after(() => {
      workspaceNameList.forEach((r) => cy.deleteRancherResource('v3', 'fleetWorkspaces', r, false));
      // Ensure the default rows per page value is set after running the tests
      cy.tableRowsPerPageAndNamespaceFilter(100, 'local', 'none', '{"local":["all://user"]}');
    });
  });

  describe('CRUD', { tags: ['@fleet', '@adminUser'] }, () => {
    it('can create a fleet workspace', () => {
      cy.intercept('POST', '/v3/fleetworkspaces').as('createWorkspace');

      fleetWorkspacesPage.goTo();
      fleetWorkspacesPage.waitForPage();
      fleetWorkspacesPage.sharedComponents().baseResourceList().masthead().title()
        .should('contain', 'Workspaces');
      fleetWorkspacesPage.sharedComponents().list().resourceTable().sortableTable()
        .noRowsShouldNotExist();
      fleetWorkspacesPage.sharedComponents().baseResourceList().masthead().create();
      fleetWorkspacesPage.createWorkspaceForm().waitForPage(null, 'allowedtargetnamespaces');
      fleetWorkspacesPage.createWorkspaceForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain('Workspace: Create');
      });
      fleetWorkspacesPage.createWorkspaceForm().sharedComponents().resourceDetail().createEditView()
        .nameNsDescription()
        .name()
        .set(customWorkspace);
      fleetWorkspacesPage.createWorkspaceForm().sharedComponents().resourceDetail().createEditView()
        .nameNsDescription()
        .description()
        .set(`${ customWorkspace }-desc`);
      fleetWorkspacesPage.createWorkspaceForm().sharedComponents().resourceDetail().tabs()
        .allTabs()
        .should('have.length.at.least', 2);

      const tabs = ['Allowed Target Namespaces', 'Labels & Annotations'];

      fleetWorkspacesPage.createWorkspaceForm().sharedComponents().resourceDetail().tabs()
        .tabNames()
        .each((el, i) => {
          expect(el).to.eq(tabs[i]);
        });

      fleetWorkspacesPage.createWorkspaceForm().sharedComponents().resourceDetail().tabs()
        .assertTabIsActive('[data-testid="allowedtargetnamespaces"]');
      fleetWorkspacesPage.createWorkspaceForm().allowTargetNsTabList().setValueAtIndex('test', 0);
      fleetWorkspacesPage.createWorkspaceForm().sharedComponents().resourceDetail().tabs()
        .clickTabWithSelector('[data-testid="btn-labels"]');
      fleetWorkspacesPage.createWorkspaceForm().waitForPage(null, 'labels');
      fleetWorkspacesPage.createWorkspaceForm().lablesAnnotationsKeyValue().setKeyValueAtIndex('Add Label', 'label-key1', 'label-value1', 0, 'div.row:nth-of-type(2)');

      // Adding Annotations doesn't work via test automation
      // See https://github.com/rancher/dashboard/issues/13191
      // fleetWorkspacesPage.createWorkspaceForm().lablesAnnotationsKeyValue().setKeyValueAtIndex('Add Annotation', 'ann-key1', 'ann-value1', 0, 'div.row:nth-of-type(3)');
      fleetWorkspacesPage.createWorkspaceForm().sharedComponents().resourceDetail().createEditView()
        .create();
      cy.wait('@createWorkspace').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
      });
      fleetWorkspacesPage.waitForPage();
      fleetWorkspacesPage.sharedComponents().list().resourceTable().sortableTable()
        .rowWithName(customWorkspace)
        .checkVisible();
    });

    it('user sees custom workspace as an option in workspace selector', () => {
      fleetWorkspacesPage.goTo();
      fleetWorkspacesPage.waitForPage();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().noRowsShouldNotExist();
      headerPo.checkCurrentWorkspace(customWorkspace);
    });

    it('can Edit Config', () => {
      fleetWorkspacesPage.goTo();
      fleetWorkspacesPage.waitForPage();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().noRowsShouldNotExist();
      fleetWorkspacesPage.sharedComponents().list().actionMenu(customWorkspace).getMenuItem('Edit Config')
        .click();
      fleetWorkspacesPage.createWorkspaceForm(customWorkspace).waitForPage('mode=edit', 'allowedtargetnamespaces');
      fleetWorkspacesPage.createWorkspaceForm().mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain(`Workspace: ${ customWorkspace }`);
      });
      fleetWorkspacesPage.createWorkspaceForm().sharedComponents().resourceDetail().createEditView()
        .nameNsDescription()
        .description()
        .set(`${ customWorkspace }-desc-edit`);
      fleetWorkspacesPage.createWorkspaceForm().sharedComponents().resourceDetail().cruResource()
        .saveAndWaitForRequests('PUT', `/v3/fleetWorkspaces/${ customWorkspace }`)
        .then(({ response }) => {
          expect(response?.statusCode).to.eq(200);
          expect(response?.body.id).to.equal(customWorkspace);
          expect(response?.body.annotations).to.have.property('field.cattle.io/description', `${ customWorkspace }-desc-edit`);
        });
      fleetWorkspacesPage.waitForPage();
    });

    it('can Download YAML', () => {
      cy.deleteDownloadsFolder();

      fleetWorkspacesPage.goTo();
      fleetWorkspacesPage.waitForPage();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().noRowsShouldNotExist();
      fleetWorkspacesPage.sharedComponents().list().actionMenu(customWorkspace).getMenuItem('Download YAML')
        .click();

      const downloadedFilename = path.join(downloadsFolder, `${ customWorkspace }.yaml`);

      cy.readFile(downloadedFilename).then((buffer) => {
        const obj: any = jsyaml.load(buffer);

        // Basic checks on the downloaded YAML
        expect(obj.kind).to.equal('FleetWorkspace');
        expect(obj.metadata['name']).to.equal(customWorkspace);
      });
    });

    it('can delete workspace', () => {
      fleetWorkspacesPage.goTo();
      fleetWorkspacesPage.waitForPage();
      fleetWorkspacesPage.sharedComponents().resourceTable().sortableTable().noRowsShouldNotExist();
      fleetWorkspacesPage.sharedComponents().list().actionMenu(customWorkspace).getMenuItem('Delete')
        .click();
      fleetWorkspacesPage.sharedComponents().list().resourceTable().sortableTable()
        .rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v3/fleetWorkspaces/${ customWorkspace }`).as('deleteWorkspace');

          promptRemove.confirmField().set(customWorkspace);
          promptRemove.remove();
          cy.wait('@deleteWorkspace');
          fleetWorkspacesPage.waitForPage();
          fleetWorkspacesPage.sharedComponents().list().resourceTable().sortableTable()
            .checkRowCount(false, rows.length - 1);
          fleetWorkspacesPage.sharedComponents().list().resourceTable().sortableTable()
            .rowNames('.col-link-detail')
            .should('not.contain', customWorkspace);
        });
    });
  });
});
