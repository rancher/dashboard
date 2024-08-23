import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
// import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
// import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
// import { LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

describe.skip('[Vue3 Skip]: Fleet Dashboard', { tags: ['@fleet', '@adminUser'] }, () => {
  let fleetDashboardPage: FleetDashboardPagePo;
  // const repoName = 'fleet-e2e-test-dashboard';

  // Note - The 'describe` previously had `.only`, which ironically meant this was not tested in our CI (probably something to so with grep tags)
  // Enabling the test results results in consistent failures (bundle does not become ready). For the short term comment these out

  beforeEach(() => {
    cy.login();
    fleetDashboardPage = new FleetDashboardPagePo('_');
    fleetDashboardPage.goTo();
  });

  it('has the correct title', () => {
    cy.get('.fleet-empty-dashboard').should('be.visible');

    cy.title().should('eq', 'Rancher - Continuous Delivery - Dashboard');
  });

  // before(() => {
  //   cy.login();

  //   const gitRepoCreatePage = new GitRepoCreatePo('_');

  //   gitRepoCreatePage.goTo();

  //   gitRepoCreatePage.setRepoName(repoName);
  //   gitRepoCreatePage.selectWorkspace('fleet-local');
  //   gitRepoCreatePage.setGitRepoUrl('https://github.com/rancher/fleet-test-data.git');
  //   gitRepoCreatePage.setBranchName();
  //   // NB - This step is here because DOM may not be ready
  //   gitRepoCreatePage.goToNext();
  //   gitRepoCreatePage.create();
  // });

  // it('Should display cluster status', () => {
  //   // check if burguer menu nav is highlighted correctly for Fleet
  //   BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Continuous Delivery');

  //   const row = fleetDashboardPage.sortableTable('fleet-local').row(0);

  //   row.get('.bg-success[data-testid="clusters-ready"]', LONG_TIMEOUT_OPT).should('exist');
  //   row.get('.bg-success[data-testid="clusters-ready"] span').should('have.text', '1/1');

  //   row.get('.bg-success[data-testid="bundles-ready"]').should('exist');
  //   row.get('.bg-success[data-testid="bundles-ready"] span').should('have.text', '1/1');

  //   row.get('.bg-success[data-testid="resources-ready"]').should('exist');
  //   row.get('.bg-success[data-testid="resources-ready"] span').should('have.text', '1/1');
  // });

  // after(() => {
  //   fleetDashboardPage = new FleetDashboardPagePo('_');
  //   fleetDashboardPage.goTo();

  //   const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-local');

  //   fleetLocalResourceTable.sortableTable().deleteItemWithUI(repoName);
  // });
});
