import { FleetDashboardListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { gitRepoTargetAllClustersRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { MenuActions } from '@/cypress/support/types/menu-actions';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { FleetGitRepoListPagePo, FleetGitRepoDetailsPo, FleetGitRepoCreateEditPo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.gitrepo.po';
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Fleet Dashboard', { tags: ['@fleet', '@adminUser', '@jenkins'] }, () => {
  const fleetDashboardPage = new FleetDashboardListPagePo('_');
  const gitRepoCreatePage = new FleetGitRepoCreateEditPo();
  const headerPo = new HeaderPo();

  let repoName;
  const gitRepoUrl = 'https://github.com/rancher/fleet-test-data';
  const branch = 'master';
  const paths = 'qa-test-apps/nginx-app';
  const localWorkspace = 'fleet-local';
  const defaultWorkspace = 'fleet-default';
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

  it('Should display cluster status', () => {
    // create gitrepo
    cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(localWorkspace, repoName, gitRepoUrl, branch, paths)).then(() => {
      removeGitRepo = true;
      reposToDelete.push(`${ localWorkspace }/${ repoName }`);
    });

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    // check if burguer menu nav is highlighted correctly for Fleet
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Continuous Delivery');

    const row = fleetDashboardPage.collapsibleTable(localWorkspace).sortableTable().row(0);

    row.get('.bg-success[data-testid="clusters-ready"]', LONG_TIMEOUT_OPT).should('exist');
    row.get('.bg-success[data-testid="clusters-ready"] span', MEDIUM_TIMEOUT_OPT).should('have.text', '1/1');

    row.get('.bg-success[data-testid="bundles-ready"]').should('exist');
    row.get('.bg-success[data-testid="bundles-ready"] span').should('have.text', '1/1');

    row.get('.bg-success[data-testid="resources-ready"]').should('exist');
    row.get('.bg-success[data-testid="resources-ready"] span').should('have.text', '1/1');
  });

  it('can navigate to Git Repo details page from Fleet Dashboard', () => {
    const gitRepoDetails = new FleetGitRepoDetailsPo(localWorkspace, repoName);

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.collapsibleTable(localWorkspace).goToDetailsPage(repoName);
    gitRepoDetails.waitForPage(null, 'bundles');
  });

  it('should only display action menu with allowed actions only', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    headerPo.selectWorkspace(localWorkspace);

    const constActionMenu = fleetDashboardPage.collapsibleTable(localWorkspace).sortableTable().rowActionMenuOpen(repoName);

    const allowedActions: MenuActions[] = [
      MenuActions.Pause,
      MenuActions.ForceUpdate,
      MenuActions.EditYaml,
      MenuActions.EditConfig,
      MenuActions.Clone,
      MenuActions.DownloadYaml,
      MenuActions.Delete
    ];

    const disabledActions: MenuActions[] = [MenuActions.ChangeWorkspace];

    allowedActions.forEach((action) => {
      constActionMenu.getMenuItem(action).should('exist');
    });

    // Disabled actions should not exist
    disabledActions.forEach((action) => {
      constActionMenu.getMenuItem(action).should('not.exist');
    });
  });

  it('can clone a git repo', () => {
    cy.intercept('GET', '/v1/fleet.cattle.io.clusters?exclude=metadata.managedFields').as('getFleetClusters');
    cy.intercept('GET', '/v1/secrets?exclude=metadata.managedFields').as('getSecrets');

    const gitRepoEditPage = new FleetGitRepoCreateEditPo(localWorkspace, repoName);

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    cy.wait('@getFleetClusters');
    fleetDashboardPage.collapsibleTable(localWorkspace).sortableTable().rowActionMenuOpen(repoName).getMenuItem('Clone')
      .click();

    gitRepoEditPage.waitForPage('mode=clone');
    gitRepoEditPage.mastheadTitle().then((title) => {
      expect(title.replace(/\s+/g, ' ')).to.contain(`Git Repo: Clone from ${ repoName }`);
    });
    headerPo.selectWorkspace(defaultWorkspace);
    gitRepoEditPage.resourceDetail().createEditView().nameNsDescription()
      .name()
      .set(`clone-${ repoName }`);
    gitRepoEditPage.resourceDetail().createEditView().nextPage();
    gitRepoEditPage.resourceDetail().createEditView().nextPage();
    gitRepoEditPage.resourceDetail().createEditView().nextPage();
    cy.wait('@getSecrets', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    gitRepoEditPage.resourceDetail().createEditView().create()
      .then(() => {
        removeGitRepo = true;
        reposToDelete.push(`${ defaultWorkspace }/clone-${ repoName }`);
      });

    FleetDashboardListPagePo.navTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.collapsibleTable(defaultWorkspace).sortableTable().rowElementWithName(`clone-${ repoName }`).should('be.visible');
    fleetDashboardPage.collapsibleTable(localWorkspace).sortableTable().rowElementWithName(repoName).should('be.visible');
  });

  it('user lands in correct git repo workspace when using workspace link on Fleet Dashboard', () => {
    const gitrepoListPage = new FleetGitRepoListPagePo();

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.collapsibleTable(defaultWorkspace).sortableTable().rowElementWithName(`clone-${ repoName }`).should('be.visible');
    fleetDashboardPage.collapsibleTable(localWorkspace).sortableTable().rowElementWithName(repoName).should('be.visible');

    // click workspace link: fleet default
    fleetDashboardPage.goToGitRepoListLink(defaultWorkspace).click();
    gitrepoListPage.waitForPage();
    headerPo.checkCurrentWorkspace(defaultWorkspace);

    // click workspace link: fleet local
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.goToGitRepoListLink(localWorkspace).click();
    gitrepoListPage.waitForPage();
    headerPo.checkCurrentWorkspace(localWorkspace);
  });

  it('can Edit Yaml', () => {
    const gitRepoEditPage = new FleetGitRepoCreateEditPo(localWorkspace, repoName);

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.collapsibleTable(localWorkspace).sortableTable().rowActionMenuOpen(repoName).getMenuItem('Edit YAML')
      .click();
    gitRepoEditPage.waitForPage('mode=edit&as=yaml');
    gitRepoEditPage.mastheadTitle().then((title) => {
      expect(title.replace(/\s+/g, ' ')).to.contain(`Git Repo: ${ repoName }`);
    });
  });

  it('can Download Yaml', () => {
    cy.deleteDownloadsFolder();

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.collapsibleTable(localWorkspace).sortableTable().rowActionMenuOpen(repoName).getMenuItem('Download YAML')
      .click();

    const downloadedFilename = path.join(downloadsFolder, `${ repoName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.kind).to.equal('GitRepo');
      expect(obj.metadata['name']).to.equal(repoName);
      expect(obj.metadata['namespace']).to.equal(localWorkspace);
      expect(obj.spec['repo']).to.equal(gitRepoUrl);
    });
  });

  it('can Edit Config', () => {
    const gitRepoEditPage = new FleetGitRepoCreateEditPo(localWorkspace, repoName);
    const description = `${ repoName }-desc`;

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.collapsibleTable(localWorkspace).sortableTable().rowActionMenuOpen(repoName).getMenuItem('Edit Config')
      .click();

    gitRepoEditPage.waitForPage('mode=edit');
    gitRepoEditPage.resourceDetail().createEditView().nameNsDescription()
      .description()
      .set(description);
    gitRepoEditPage.resourceDetail().createEditView().nextPage();
    gitRepoEditPage.resourceDetail().createEditView().save();
    fleetDashboardPage.waitForPage();
  });

  after(() => {
    if (removeGitRepo) {
      // delete gitrepo
      reposToDelete.forEach((r) => cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', r));
    }
  });
});
