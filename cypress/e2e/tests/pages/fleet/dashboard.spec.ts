import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

describe.only('Fleet Dashboard', { tags: ['@fleet', '@adminUser'] }, () => {
  let fleetDashboardPage: FleetDashboardPagePo;
  const repoName = 'fleet-e2e-test-dashboard';

  beforeEach(() => {
    cy.login();
    fleetDashboardPage = new FleetDashboardPagePo('_');
    fleetDashboardPage.goTo();
  });

  beforeEach(() => { });

  before(() => {
    cy.login();

    const gitRepoCreatePage = new GitRepoCreatePo('_');

    gitRepoCreatePage.goTo();

    gitRepoCreatePage.setRepoName(repoName);
    gitRepoCreatePage.selectWorkspace('fleet-local');
    gitRepoCreatePage.setGitRepoUrl('https://github.com/rancher/fleet-test-data.git');
    gitRepoCreatePage.setBranchName();
    // NB - This step is here because DOM may not be ready
    gitRepoCreatePage.goToNext();
    gitRepoCreatePage.create();
  });

  it('Should display cluster status', () => {
    // check if burguer menu nav is highlighted correctly for Fleet
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Continuous Delivery');

    const row = fleetDashboardPage.sortableTable('fleet-local').row(0);

    row.get('.bg-success[data-testid="clusters-ready"]').should('exist');
    row.get('.bg-success[data-testid="clusters-ready"] span').should('have.text', '1/1');

    row.get('.bg-success[data-testid="clusters-ready"]').should('exist');
    row.get('.bg-success[data-testid="bundles-ready"] span').should('have.text', '1/1');

    row.get('.bg-success[data-testid="clusters-ready"]').should('exist');
    row.get('.bg-success[data-testid="resources-ready"] span').should('have.text', '1/1');
  });

  after(() => {
    fleetDashboardPage = new FleetDashboardPagePo('_');
    fleetDashboardPage.goTo();

    const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-local');

    fleetLocalResourceTable.sortableTable().deleteItemWithUI(repoName);
  });
});
