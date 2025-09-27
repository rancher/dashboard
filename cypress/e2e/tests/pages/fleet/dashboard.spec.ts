import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import { FleetApplicationCreatePo, FleetGitRepoCreateEditPo } from '~/cypress/e2e/po/pages/fleet/fleet.cattle.io.application.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { gitRepoTargetAllClustersRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import FleetApplicationDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.application.po';

describe('Fleet Dashboard', { tags: ['@fleet', '@adminUser', '@jenkins'] }, () => {
  const fleetDashboardPage = new FleetDashboardListPagePo('_');
  const appBundleCreatePage = new FleetApplicationCreatePo();
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

  it('Has the correct title', () => {
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

    appBundleCreatePage.waitForPage();
    appBundleCreatePage.createGitRepo();

    gitRepoCreatePage.waitForPage();
    gitRepoCreatePage.mastheadTitle().then((title) => {
      expect(title.replace(/\s+/g, ' ')).to.contain('App Bundle: Create');
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

    const applicationsPanel = workspaceCard.resourcePanel('applications');

    applicationsPanel.chart().should('exist');
    applicationsPanel.stateBadge('success').should('exist');
    applicationsPanel.description().should('contain', '1');

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

    const expandedPanel = workspaceCard.expandedPanel();
    const cardsPanel = expandedPanel.cardsPanel();

    cardsPanel.self().should('be.visible');

    expandedPanel.gitReposFilter().checkVisible();
    expandedPanel.gitReposFilter().isChecked();

    expandedPanel.helmOpsFilter().checkVisible();
    expandedPanel.helmOpsFilter().isChecked();

    const activeStatePanel = cardsPanel.statePanel('Active');

    activeStatePanel.title().should('contain.text', 'Active');
    activeStatePanel.title().should('contain.text', '1');
    activeStatePanel.title().should('contain.text', '/1');
    activeStatePanel.title().click();

    activeStatePanel.card(repoName).should('be.visible');
  });

  it('Should filter by GitRepo type', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);
    const expandButton = workspaceCard.expandButton();

    expandButton.click();

    const expandedPanel = workspaceCard.expandedPanel();
    const cardsPanel = expandedPanel.cardsPanel();

    expandedPanel.gitReposFilter().set();
    const activeStatePanel = cardsPanel.statePanel('Active');

    activeStatePanel.self().should('not.be.visible');
  });

  it('Should change ViewMode', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);
    const expandButton = workspaceCard.expandButton();

    expandButton.click();

    const cardsPanel = workspaceCard.expandedPanel().cardsPanel();

    cardsPanel.self().should('be.visible');

    // click 'table' mode (first button is table mode)
    fleetDashboardPage.viewModeButton().self().find('[data-testid="button-group-child-0"]').click();

    cardsPanel.checkNotExists();

    const tablePanel = workspaceCard.expandedPanel().tablePanel();

    tablePanel.checkVisible();
  });

  it('Should open slide-in panel', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);
    const expandButton = workspaceCard.expandButton();

    expandButton.click();

    const cardsPanel = workspaceCard.expandedPanel().cardsPanel();

    const activeStatePanel = cardsPanel.statePanel('Active');

    activeStatePanel.title().click();

    activeStatePanel.card(repoName).click();

    const details = fleetDashboardPage.slideInPanel();

    details.should('be.visible');
    details.should('contain.text', repoName);
  });

  it('Should navigate to App Bundles details page from Fleet Dashboard', () => {
    const appDetails = new FleetApplicationDetailsPo(localWorkspace, repoName, 'fleet.cattle.io.gitrepo');

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    const workspaceCard = fleetDashboardPage.workspaceCard(localWorkspace);
    const expandButton = workspaceCard.expandButton();

    expandButton.click();

    const cardsPanel = workspaceCard.expandedPanel().cardsPanel();

    const activeStatePanel = cardsPanel.statePanel('Active');

    activeStatePanel.title().click();
    activeStatePanel.card(repoName).should('be.visible').click();

    const details = fleetDashboardPage.slideInPanel();

    details.should('be.visible');
    details.find('.title').should('contain.text', repoName).click();

    appDetails.waitForPage(null, 'bundles');
  });

  after(() => {
    if (removeGitRepo) {
      // delete gitrepo
      reposToDelete.forEach((r) => cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', r));
    }
  });
});
