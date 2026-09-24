import { FleetApplicationListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { FleetWorkspaceListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.fleetworkspace.po';
import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import { FLEET_DEFAULT_WORKSPACE } from '@/cypress/e2e/blueprints/fleet/gitrepos';

const defaultWorkspace = FLEET_DEFAULT_WORKSPACE;

describe('Fleet workspace selection', { tags: ['@fleet', '@adminUser'] }, () => {
  const appBundlesPage = new FleetApplicationListPagePo();
  const fleetDashboardPage = new FleetDashboardListPagePo('_');
  const homePage = new HomePagePo();
  const headerPo = new HeaderPo();

  let workspace = '';

  const navToAppBundles = () => {
    FleetDashboardListPagePo.navTo();
    fleetDashboardPage.waitForPage();
    new ProductNavPo().navToSideMenuEntryByLabel('App Bundles');
    appBundlesPage.waitForPage();
  };

  beforeEach(() => {
    cy.login();

    cy.createFleetWorkspace('fleet-workspace-selection', undefined, true, { createNameOptions: { prefixContext: true } }).then((resp: Cypress.Response<any>) => {
      workspace = resp.body.id;

      cy.waitForRancherResource('v1', 'management.cattle.io.fleetworkspaces', workspace, (resp: Cypress.Response<any>) => resp?.status === 200 && resp?.body?.id === workspace, 20, { failOnStatusCode: false });
    });
  });

  it('should restore the selected workspace after a page reload', () => {
    appBundlesPage.goTo();
    appBundlesPage.waitForPage();

    const prefWrites: unknown[] = [];

    cy.intercept('PUT', '/v1/userpreferences/*', (req: any) => {
      prefWrites.push(req.body?.data?.workspace);
    }).as('workspacePreference');
    headerPo.selectWorkspace(workspace);
    cy.wait('@workspacePreference');

    // A preference write is a queued get-before-set against a document shared by every preference,
    // so a PUT landing is not proof that ours did. Wait until the server really holds the selection.
    cy.waitForRancherResource('v1', 'userpreferences', '', (resp: Cypress.Response<any>) => resp?.status === 200 && resp?.body?.data?.[0]?.data?.workspace === workspace, 20, { failOnStatusCode: false });

    cy.then(() => cy.log(`workspace values written before reload: ${ JSON.stringify(prefWrites) }`));

    // The switcher renders from the workspace list, and waiting for the page is not waiting for
    // that request: assert too early and the selection still reads as the default with the options
    // empty. Wait for the list the switcher is filled from.
    cy.intercept('GET', '/v1/management.cattle.io.fleetworkspaces*').as('workspaceList');
    cy.reload();
    appBundlesPage.waitForPage();
    cy.wait('@workspaceList');
    cy.then(() => cy.log(`workspace values written in total: ${ JSON.stringify(prefWrites) }`));
    headerPo.checkCurrentWorkspace(workspace);

    // Leave the stored preference on the default, so the next test does not start out pointing at the
    // workspace afterEach is about to delete.
    headerPo.selectWorkspace(defaultWorkspace);
  });

  it('should select the default workspace when the selected one is removed while the user is elsewhere', () => {
    appBundlesPage.goTo();
    appBundlesPage.waitForPage();

    cy.intercept('PUT', '/v1/userpreferences/*').as('workspacePreference');
    headerPo.selectWorkspace(workspace);
    cy.wait('@workspacePreference');

    HomePagePo.goTo();
    homePage.waitForPage();

    cy.deleteRancherResource('v3', 'fleetworkspaces', workspace);

    navToAppBundles();

    headerPo.checkCurrentWorkspace(defaultWorkspace);
    headerPo.workspaceSwitcher().self().should('not.contain.text', workspace);
  });

  it('should not keep a workspace that was deleted from the workspaces list', () => {
    const fleetWorkspacesListPage = new FleetWorkspaceListPagePo();

    appBundlesPage.goTo();
    appBundlesPage.waitForPage();

    cy.intercept('PUT', '/v1/userpreferences/*').as('workspacePreference');
    headerPo.selectWorkspace(workspace);
    cy.wait('@workspacePreference');

    FleetWorkspaceListPagePo.navTo();
    fleetWorkspacesListPage.waitForPage();
    fleetWorkspacesListPage.list().resourceTable().sortableTable()
      .noRowsShouldNotExist();
    fleetWorkspacesListPage.list().actionMenu(workspace).getMenuItem('Delete')
      .click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `/v3/fleetWorkspaces/${ workspace }`).as('deleteWorkspace');
    promptRemove.confirmField().set(workspace);
    promptRemove.remove();
    cy.wait('@deleteWorkspace');

    navToAppBundles();

    headerPo.checkCurrentWorkspace(defaultWorkspace);
    headerPo.workspaceSwitcher().self().should('not.contain.text', workspace);
  });

  afterEach(() => {
    cy.deleteRancherResource('v3', 'fleetworkspaces', workspace, false);
  });
});
