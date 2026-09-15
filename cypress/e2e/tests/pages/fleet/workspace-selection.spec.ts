import { FleetApplicationListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';

const defaultWorkspace = 'fleet-default';

describe('Fleet workspace selection', { tags: ['@fleet', '@adminUser'] }, () => {
  const appBundlesPage = new FleetApplicationListPagePo();
  const headerPo = new HeaderPo();

  let workspace = '';

  beforeEach(() => {
    cy.login();

    cy.createFleetWorkspace('fleet-workspace-selection', undefined, true, { createNameOptions: { prefixContext: true } }).then((resp: Cypress.Response<any>) => {
      workspace = resp.body.id;
    });
  });

  it('should restore the selected workspace after a page reload', () => {
    appBundlesPage.goTo();
    appBundlesPage.waitForPage();
    headerPo.selectWorkspace(workspace);

    cy.reload();
    appBundlesPage.waitForPage();
    headerPo.checkCurrentWorkspace(workspace);

    // Leave the user preference on a workspace that outlives this spec
    headerPo.selectWorkspace(defaultWorkspace);
  });

  it('should select the default workspace when the selected one is removed while the user is elsewhere', () => {
    appBundlesPage.goTo();
    appBundlesPage.waitForPage();
    headerPo.selectWorkspace(workspace);

    HomePagePo.goTo();
    new HomePagePo().waitForPage();

    cy.deleteRancherResource('v3', 'fleetworkspaces', workspace);

    appBundlesPage.navTo();
    appBundlesPage.waitForPage();

    headerPo.checkCurrentWorkspace(defaultWorkspace);
    headerPo.workspaceSwitcher().self().should('not.contain.text', workspace);

    workspace = '';
  });

  afterEach(() => {
    if (workspace) {
      cy.deleteRancherResource('v3', 'fleetworkspaces', workspace, false);
    }
  });
});
