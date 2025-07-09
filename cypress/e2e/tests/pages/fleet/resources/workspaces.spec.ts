import { FleetWorkspaceListPagePo, FleetWorkspaceCreateEditPo, FleetWorkspaceDetailsPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.fleetworkspace.po';
import { generateFleetWorkspacesDataSmall } from '@/cypress/e2e/blueprints/fleet/workspaces-get';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import SortableTablePo from '@/cypress/e2e/po/components/sortable-table.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { ociSecretCreateRequest } from '@/cypress/e2e/blueprints/explorer/storage/secret';
import AboutPagePo from '~/cypress/e2e/po/pages/about.po';
import { SettingsPagePo } from '~/cypress/e2e/po/pages/global-settings/settings.po';

const defaultWorkspace = 'fleet-default';
const workspaceNameList = [];
let customWorkspace = '';
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Workspaces', { testIsolation: 'off', tags: ['@fleet', '@adminUser'] }, () => {
  const fleetWorkspacesListPage = new FleetWorkspaceListPagePo();

  const headerPo = new HeaderPo();

  before(() => {
    cy.login();
    cy.createE2EResourceName('fleet-workspace').then((name) => {
      customWorkspace = name;
    });
  });

  describe('List', { tags: ['@noVai', '@adminUser'] }, () => {
    let initialCount: number;

    it('check table headers are available in list and details view', () => {
      fleetWorkspacesListPage.goTo();
      fleetWorkspacesListPage.waitForPage();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .noRowsShouldNotExist();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .filter(defaultWorkspace);
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .checkRowCount(false, 1);

      // check table headers
      const expectedHeaders = ['State', 'Name', 'Git Repos', 'Helm Ops', 'Clusters', 'Cluster Groups', 'Age'];

      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeaders[i]);
        });

      // go to fleet workspaces details
      fleetWorkspacesListPage.goToDetailsPage(defaultWorkspace);

      const fleetWorkspaceDetailsPage = new FleetWorkspaceDetailsPo(defaultWorkspace);

      fleetWorkspaceDetailsPage.waitForPage(null, 'events');

      // check table headers
      const expectedHeadersDetailsViewEvents = ['Type', 'Reason', 'Updated', 'Message'];

      fleetWorkspaceDetailsPage.recentEventsList().sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeadersDetailsViewEvents[i]);
        });

      fleetWorkspaceDetailsPage.workspaceTabs().clickTabWithSelector('[data-testid="related"]');
      fleetWorkspaceDetailsPage.waitForPage(null, 'related');

      // check table headers
      const expectedHeadersDetailsViewResources = ['State', 'Type', 'Name', 'Namespace'];

      fleetWorkspaceDetailsPage.relatedResourcesList(1).sortableTable()
        .tableHeaderRow()
        .within('.table-header-container .content')
        .each((el, i) => {
          expect(el.text().trim()).to.eq(expectedHeadersDetailsViewResources[i]);
        });

      fleetWorkspaceDetailsPage.relatedResourcesList(2).sortableTable()
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
        fleetWorkspacesListPage.waitForPage();

        // pagination is visible
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .checkVisible();

        // basic checks on navigation buttons
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .beginningButton()
          .isDisabled();
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .leftButton()
          .isDisabled();
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .rightButton()
          .isEnabled();
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .endButton()
          .isEnabled();

        // check text before navigation
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Workspaces`);
          });

        // navigate to next page - right button
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .rightButton()
          .click();

        // check text and buttons after navigation
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`11 - 20 of ${ count } Workspaces`);
          });
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .beginningButton()
          .isEnabled();
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .leftButton()
          .isEnabled();

        // navigate to first page - left button
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .leftButton()
          .click();

        // check text and buttons after navigation
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Workspaces`);
          });
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .beginningButton()
          .isDisabled();
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .leftButton()
          .isDisabled();

        // navigate to last page - end button
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .endButton()
          .scrollIntoView()
          .click();

        // check row count on last page
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .checkRowCount(false, count - 20);

        // check text after navigation
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`21 - ${ count } of ${ count } Workspaces`);
          });

        // navigate to first page - beginning button
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .beginningButton()
          .click();

        // check text and buttons after navigation
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .paginationText()
          .then((el) => {
            expect(el.trim()).to.eq(`1 - 10 of ${ count } Workspaces`);
          });
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .beginningButton()
          .isDisabled();
        fleetWorkspacesListPage.list().resourceTable().sortableTable()
          .pagination()
          .leftButton()
          .isDisabled();
      });
    });

    it('filter workspace', () => {
      FleetWorkspaceListPagePo.navTo();
      fleetWorkspacesListPage.waitForPage();

      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .checkVisible();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .checkLoadingIndicatorNotVisible();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .checkRowCount(false, 10);

      // filter by name
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .filter(workspaceNameList[0]);
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .checkRowCount(false, 1);
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .rowElementWithName(workspaceNameList[0])
        .scrollIntoView()
        .should('be.visible');
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .resetFilter();
    });

    it('sorting changes the order of paginated workspace data', () => {
      FleetWorkspaceListPagePo.navTo();
      fleetWorkspacesListPage.waitForPage();

      // check table is sorted by access key in ASC order by default
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .tableHeaderRow()
        .checkSortOrder(2, 'down');

      // workspace name should be visible on first page (sorted in ASC order)
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .tableHeaderRow()
        .self()
        .scrollIntoView();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .rowElementWithName(uniqueWorkspaceName)
        .scrollIntoView()
        .should('be.visible');

      // navigate to last page
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // workspace name should be NOT visible on last page (sorted in ASC order)
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .rowElementWithName(uniqueWorkspaceName)
        .should('not.exist');

      // sort by name in DESC order
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .sort(2)
        .click();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .tableHeaderRow()
        .checkSortOrder(2, 'up');

      // workspace name should be NOT visible on first page (sorted in DESC order)
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .rowElementWithName(uniqueWorkspaceName)
        .should('not.exist');

      // navigate to last page
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .pagination()
        .endButton()
        .scrollIntoView()
        .click();

      // workspace name should be visible on last page (sorted in DESC order)
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .rowElementWithName(uniqueWorkspaceName)
        .scrollIntoView()
        .should('be.visible');
    });

    it('pagination is hidden', () => {
      generateFleetWorkspacesDataSmall();
      fleetWorkspacesListPage.goTo();
      fleetWorkspacesListPage.waitForPage();
      cy.wait('@fleetworkspacesDataSmall');

      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .checkVisible();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .checkLoadingIndicatorNotVisible();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .checkRowCount(false, 2);
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .pagination()
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
      const fleetWorkspaceCreateEditPage = new FleetWorkspaceCreateEditPo();

      cy.intercept('POST', '/v3/fleetworkspaces').as('createWorkspace');

      fleetWorkspacesListPage.goTo();
      fleetWorkspacesListPage.waitForPage();
      fleetWorkspacesListPage.baseResourceList().masthead().title()
        .should('contain', 'Workspaces');
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .noRowsShouldNotExist();
      fleetWorkspacesListPage.baseResourceList().masthead().create();
      fleetWorkspaceCreateEditPage.waitForPage(null, 'allowedtargetnamespaces');
      fleetWorkspaceCreateEditPage.mastheadTitle().then((title) => {
        expect(title.replace(/\s+/g, ' ')).to.contain('Workspace: Create');
      });
      fleetWorkspaceCreateEditPage.resourceDetail().createEditView()
        .nameNsDescription()
        .name()
        .set(customWorkspace);
      fleetWorkspaceCreateEditPage.resourceDetail().createEditView()
        .nameNsDescription()
        .description()
        .set(`${ customWorkspace }-desc`);
      fleetWorkspaceCreateEditPage.resourceDetail().tabs()
        .allTabs()
        .should('have.length.at.least', 2);

      const tabs = ['Allowed Target Namespaces', 'Labels & Annotations'];

      fleetWorkspaceCreateEditPage.resourceDetail().tabs()
        .tabNames()
        .each((el, i) => {
          expect(el).to.eq(tabs[i]);
        });

      fleetWorkspaceCreateEditPage.resourceDetail().tabs()
        .assertTabIsActive('[data-testid="allowedtargetnamespaces"]');
      fleetWorkspaceCreateEditPage.allowTargetNsTabList().setValueAtIndex('test', 0, 'Add');
      fleetWorkspaceCreateEditPage.resourceDetail().tabs()
        .clickTabWithSelector('[data-testid="btn-labels"]');
      fleetWorkspaceCreateEditPage.waitForPage(null, 'labels');
      fleetWorkspaceCreateEditPage.lablesAnnotationsKeyValue().setKeyValueAtIndex('Add Label', 'label-key1', 'label-value1', 0, 'div.row:nth-of-type(2)');

      // Adding Annotations doesn't work via test automation
      // See https://github.com/rancher/dashboard/issues/13191
      // fleetWorkspaceCreateEditPage.lablesAnnotationsKeyValue().setKeyValueAtIndex('Add Annotation', 'ann-key1', 'ann-value1', 0, 'div.row:nth-of-type(3)');
      fleetWorkspaceCreateEditPage.resourceDetail().createEditView()
        .create();
      cy.wait('@createWorkspace').then(({ response }) => {
        expect(response?.statusCode).to.eq(201);
      });
      fleetWorkspacesListPage.waitForPage();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .rowWithName(customWorkspace)
        .checkVisible();
    });

    it('user sees custom workspace as an option in workspace selector', () => {
      fleetWorkspacesListPage.goTo();
      fleetWorkspacesListPage.waitForPage();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .noRowsShouldNotExist();
      headerPo.checkCurrentWorkspace(customWorkspace);
    });

    it('can Edit Config', () => {
      const fleetWorkspaceCreateEditPage = new FleetWorkspaceCreateEditPo(customWorkspace);

      cy.createE2EResourceName('oci-secret').as('ociSecret');
      cy.get<string>('@ociSecret').then((ociSecretName) => {
        cy.createRancherResource('v1', 'secrets', ociSecretCreateRequest(customWorkspace, ociSecretName)).then(() => {
          fleetWorkspacesListPage.goTo();
          fleetWorkspacesListPage.waitForPage();
          fleetWorkspacesListPage.list().resourceTable().sortableTable()
            .noRowsShouldNotExist();
          fleetWorkspacesListPage.list().actionMenu(customWorkspace).getMenuItem('Edit Config')
            .click();
          fleetWorkspaceCreateEditPage.waitForPage('mode=edit', 'allowedtargetnamespaces');
          fleetWorkspaceCreateEditPage.mastheadTitle().then((title) => {
            expect(title.replace(/\s+/g, ' ')).to.contain(`Workspace: ${ customWorkspace }`);
          });

          const editView = fleetWorkspaceCreateEditPage.resourceDetail().createEditView();

          editView.nameNsDescription().description().set(`${ customWorkspace }-desc-edit`);

          fleetWorkspaceCreateEditPage.resourceDetail().tabs().clickTabWithSelector('[data-testid="btn-ociRegistries"]');

          fleetWorkspaceCreateEditPage.defaultOciRegistry().toggle();
          fleetWorkspaceCreateEditPage.defaultOciRegistry().clickLabel(ociSecretName);

          fleetWorkspaceCreateEditPage.resourceDetail().cruResource()
            .saveAndWaitForRequests('PUT', `/v3/fleetWorkspaces/${ customWorkspace }`)
            .then(({ response }) => {
              expect(response?.statusCode).to.eq(200);
              expect(response?.body.id).to.equal(customWorkspace);
              expect(response?.body.annotations).to.have.property('field.cattle.io/description', `${ customWorkspace }-desc-edit`);
              expect(response?.body.annotations).to.have.property('ui-default-oci-registry', ociSecretName);
            });
          fleetWorkspacesListPage.waitForPage();
        });
      });
    });

    it('can Download YAML', () => {
      cy.deleteDownloadsFolder();

      fleetWorkspacesListPage.goTo();
      fleetWorkspacesListPage.waitForPage();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .noRowsShouldNotExist();
      fleetWorkspacesListPage.list().actionMenu(customWorkspace).getMenuItem('Download YAML')
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
      fleetWorkspacesListPage.goTo();
      fleetWorkspacesListPage.waitForPage();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .noRowsShouldNotExist();
      fleetWorkspacesListPage.list().actionMenu(customWorkspace).getMenuItem('Delete')
        .click();
      fleetWorkspacesListPage.list().resourceTable().sortableTable()
        .rowNames('.col-link-detail')
        .then((rows: any) => {
          const promptRemove = new PromptRemove();

          cy.intercept('DELETE', `/v3/fleetWorkspaces/${ customWorkspace }`).as('deleteWorkspace');

          promptRemove.confirmField().set(customWorkspace);
          promptRemove.remove();
          cy.wait('@deleteWorkspace');
          fleetWorkspacesListPage.waitForPage();
          fleetWorkspacesListPage.list().resourceTable().sortableTable()
            .checkRowCount(false, rows.length - 1);
          fleetWorkspacesListPage.list().resourceTable().sortableTable()
            .rowNames('.col-link-detail')
            .should('not.contain', customWorkspace);
        });
    });
  });
});
