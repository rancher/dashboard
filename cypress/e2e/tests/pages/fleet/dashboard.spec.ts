import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import { FleetGitRepoDetailsPo, FleetGitRepoCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.gitrepo.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { gitRepoTargetAllClustersRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';

describe('Fleet Dashboard', { tags: ['@fleet', '@adminUser', '@jenkins'] }, () => {
  const fleetDashboardPage = new FleetDashboardListPagePo('_');
  const gitRepoCreatePage = new FleetGitRepoCreateEditPo();

  let repoName;
  const gitRepoUrl = 'https://github.com/rancher/fleet-test-data';
  const branch = 'master';
  const paths = 'qa-test-apps/nginx-app';
  const localWorkspace = 'fleet-local';
  // const defaultWorkspace = 'fleet-default';
  let removeGitRepo = false;
  const reposToDelete = [];

  beforeEach(() => {
    cy.login();
    cy.createE2EResourceName('git-repo').then((name) => {
      repoName = name;
    });
  });

  it('has the correct title', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    fleetDashboardPage.fleetDashboardEmptyState().should('be.visible');

    cy.title().should('eq', 'Rancher - Continuous Delivery - Dashboard');
  });

  it('Get Started button takes you to the correct page', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    fleetDashboardPage.fleetDashboardEmptyState().should('be.visible');
    fleetDashboardPage.getStartedButton().click();
    gitRepoCreatePage.waitForPage();
    gitRepoCreatePage.mastheadTitle().then((title) => {
      expect(title.replace(/\s+/g, ' ')).to.contain('Git Repo: Create');
    });
  });

  it('Should display workspace cards', () => {
    // create gitrepo
    cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(localWorkspace, repoName, gitRepoUrl, branch, paths)).then(() => {
      removeGitRepo = true;
      reposToDelete.push(`${ localWorkspace }/${ repoName }`);
    });

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    // check if burguer menu nav is highlighted correctly for Fleet
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Continuous Delivery');

    fleetDashboardPage.viewModeButton().checkVisible();

    const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);

    workspaceCard.expandButton().should('be.visible');

    // TODO change to fleet applications when HelmOps enabled
    const gitReposPanel = workspaceCard.resourcePanel('applications');

    gitReposPanel.chart().should('exist');
    gitReposPanel.stateBadge('success').should('exist');
    gitReposPanel.description().should('contain', '1');

    const clustersPanel = workspaceCard.resourcePanel('clusters');

    clustersPanel.chart().should('exist');
    clustersPanel.stateBadge('success').should('exist');
    clustersPanel.description().should('contain', '1');

    const clusterGroupsPanel = workspaceCard.resourcePanel('cluster-groups');

    clusterGroupsPanel.self().should('exist');
    clusterGroupsPanel.chart().should('not.exist');
    clusterGroupsPanel.stateBadge('success').should('exist');
    clusterGroupsPanel.description().should('contain', '1');
  });

  it('Should show workspace cards panel when expanded', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);

    const expandButton = workspaceCard.expandButton();

    expandButton.should('be.visible');
    expandButton.click();

    const cardsPanel = workspaceCard.cardsPanel();

    cardsPanel.self().should('be.visible');

    // TODO re-enabled when HelmOps available
    // cardsPanel.gitReposFilter().checkVisible();
    // cardsPanel.gitReposFilter().isChecked();

    // cardsPanel.helmOpsFilter().checkVisible();
    // cardsPanel.helmOpsFilter().isChecked();

    const activeStatePanel = cardsPanel.statePanel('Active');

    activeStatePanel.title().should('contain.text', 'Active');
    activeStatePanel.title().should('contain.text', '1');
    activeStatePanel.title().should('contain.text', '/1');
    activeStatePanel.title().click();

    const card = activeStatePanel.card(repoName);

    card.should('be.visible');
    card.find('.title').should('contain.text', repoName);
  });

  // TODO re-enabled when HelmOps available

  // it('Should filter by GitRepo type', () => {
  //   fleetDashboardPage.goTo();
  //   fleetDashboardPage.waitForPage();

  //   const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);
  //   const expandButton = workspaceCard.expandButton();

  //   expandButton.click();

  //   const cardsPanel = workspaceCard.cardsPanel();

  //   cardsPanel.gitReposFilter().set();
  //   const activeStatePanel = cardsPanel.statePanel('Active');

  //   activeStatePanel.self().should('not.be.visible');
  // });

  it('Should change ViewMode', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);
    const expandButton = workspaceCard.expandButton();

    expandButton.click();

    const cardsPanel = workspaceCard.cardsPanel();

    cardsPanel.checkExists();

    // click 'card' mode
    fleetDashboardPage.viewModeButton().self().find('[data-testid="button-group-child-0"]').click();

    cardsPanel.checkNotExists();

    const tablePanel = workspaceCard.tablePanel();

    tablePanel.checkExists();
  });

  it('Should open slide-in panel', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);
    const expandButton = workspaceCard.expandButton();

    expandButton.click();

    const cardsPanel = workspaceCard.cardsPanel();

    const activeStatePanel = cardsPanel.statePanel('Active');

    activeStatePanel.title().click();

    activeStatePanel.card(repoName).click();

    const details = fleetDashboardPage.slideInPanel();

    details.should('be.visible');
    details.should('contain.text', repoName);
  });

  it('Should navigate to Git Repo details page from Fleet Dashboard', () => {
    const gitRepoDetails = new FleetGitRepoDetailsPo(localWorkspace, repoName);

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);
    const expandButton = workspaceCard.expandButton();

    expandButton.click();

    const cardsPanel = workspaceCard.cardsPanel();

    const activeStatePanel = cardsPanel.statePanel('Active');

    activeStatePanel.title().click();

    const card = activeStatePanel.card(repoName);

    card.find('.title a').click();

    gitRepoDetails.waitForPage(null, 'bundles');
  });

  after(() => {
    if (removeGitRepo) {
      // delete gitrepo
      reposToDelete.forEach((r) => cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', r));
    }
  });
});
