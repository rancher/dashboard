import { FleetApplicationListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { FleetWorkspaceListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.fleetworkspace.po';
import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const defaultWorkspace = 'fleet-default';

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

    cy.intercept('PUT', '/v1/userpreferences/*').as('workspacePreference');
    headerPo.selectWorkspace(workspace);
    cy.wait('@workspacePreference');

    cy.reload();
    appBundlesPage.waitForPage();
    headerPo.checkCurrentWorkspace(workspace);

    headerPo.selectWorkspace(defaultWorkspace);
  });

  it('should select the default workspace when the selected one is removed while the user is elsewhere', () => {
    appBundlesPage.goTo();
    appBundlesPage.waitForPage();
    headerPo.selectWorkspace(workspace);

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
    headerPo.selectWorkspace(workspace);

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
