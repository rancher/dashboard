import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import FleetGitRepoDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.gitrepo.po';
import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import { GitRepoEditPo } from '@/cypress/e2e/po/edit/fleet/gitrepo-edit.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { gitRepoTargetAllClustersRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import { HeaderPo } from '@/cypress/e2e/po/components/header.po';
import { MenuActions } from '@/cypress/support/types/menu-actions';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { FleetGitRepoListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.gitrepo.po';
const downloadsFolder = Cypress.config('downloadsFolder');

describe('Fleet Dashboard', { tags: ['@fleet', '@adminUser', '@jenkins'] }, () => {
  const fleetDashboardPage = new FleetDashboardPagePo('_');
  const gitRepoCreatePage = new GitRepoCreatePo('_');
  const headerPo = new HeaderPo();

  let repoName;
  const gitRepoUrl = 'https://github.com/rancher/fleet-test-data';
  const branch = 'master';
  const paths = 'qa-test-apps/nginx-app';
  const localWorkspace = 'fleet-local';
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
    gitRepoCreatePage.title().contains('Git Repo: Create').should('be.visible');
  });

  it('Should display cluster status', () => {
    // create gitrepo
    cy.createRancherResource('v1', 'fleet.cattle.io.gitrepos', gitRepoTargetAllClustersRequest(localWorkspace, repoName, gitRepoUrl, branch, paths)).then(() => {
      removeGitRepo = true;
      reposToDelete.push(`fleet-local/${ repoName }`);
    });

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();

    // check if burguer menu nav is highlighted correctly for Fleet
    BurgerMenuPo.checkIfMenuItemLinkIsHighlighted('Continuous Delivery');

    const row = fleetDashboardPage.sortableTable(localWorkspace).row(0);

    row.get('.bg-success[data-testid="clusters-ready"]', LONG_TIMEOUT_OPT).should('exist');
    row.get('.bg-success[data-testid="clusters-ready"] span').should('have.text', '1/1');

    row.get('.bg-success[data-testid="bundles-ready"]').should('exist');
    row.get('.bg-success[data-testid="bundles-ready"] span').should('have.text', '1/1');

    row.get('.bg-success[data-testid="resources-ready"]').should('exist');
    row.get('.bg-success[data-testid="resources-ready"] span').should('have.text', '1/1');
  });

  it('can navigate to Git Repo details page from Fleet Dashboard', () => {
    const gitRepoDetails = new FleetGitRepoDetailsPo(localWorkspace, repoName);

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.list().rowWithName(repoName).column(0).find('a')
      .click();
    gitRepoDetails.waitForPage(null, 'bundles');
  });

  it('should only display action menu with allowed actions only', () => {
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    headerPo.selectWorkspace(localWorkspace);

    const constActionMenu = fleetDashboardPage.sortableTable().rowActionMenuOpen(repoName);

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
    const gitRepoEditPage = new GitRepoEditPo(localWorkspace, repoName);

    cy.intercept('GET', '/v1/secrets?exclude=metadata.managedFields').as('getSecrets');

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.sortableTable().rowActionMenuOpen(repoName).getMenuItem('Clone').click();

    gitRepoEditPage.waitForPage('mode=clone');
    cy.wait('@getSecrets', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
    gitRepoEditPage.title().contains(`Git Repo: Clone from ${ repoName }`).should('be.visible');
    headerPo.selectWorkspace('fleet-default');
    gitRepoEditPage.nameNsDescription().name().set(`clone-${ repoName }`);
    gitRepoEditPage.footer().nextPage();
    gitRepoEditPage.footer().create().then(() => {
      removeGitRepo = true;
      reposToDelete.push(`fleet-default/clone-${ repoName }`);
    });

    FleetDashboardPagePo.navTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.sortableTable('fleet-default').rowElementWithName(`clone-${ repoName }`).should('be.visible');
    fleetDashboardPage.sortableTable('fleet-local').rowElementWithName(repoName).should('be.visible');
  });

  it('user lands in correct git repo workspace when using workspace link on Fleet Dashboard', () => {
    const gitrepoListPage = new FleetGitRepoListPagePo();

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.sortableTable('fleet-default').rowElementWithName(`clone-${ repoName }`).should('be.visible');
    fleetDashboardPage.sortableTable('fleet-local').rowElementWithName(repoName).should('be.visible');

    // click workspace link: fleet default
    fleetDashboardPage.goToGitRepoListLink('fleet-default').click();
    gitrepoListPage.waitForPage();
    headerPo.checkCurrentWorkspace('fleet-default');

    // click workspace link: fleet local
    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.goToGitRepoListLink('fleet-local').click();
    gitrepoListPage.waitForPage();
    headerPo.checkCurrentWorkspace('fleet-local');
  });

  it('can Edit Yaml', () => {
    const gitRepoEditPage = new GitRepoEditPo(localWorkspace, repoName);

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.sortableTable().rowActionMenuOpen(repoName).getMenuItem('Edit YAML').click();
    gitRepoEditPage.waitForPage('mode=edit&as=yaml');
    gitRepoEditPage.title().contains(`Git Repo: ${ repoName }`).should('be.visible');
  });

  it('can Download Yaml', () => {
    cy.deleteDownloadsFolder();

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.sortableTable().rowActionMenuOpen(repoName).getMenuItem('Download YAML').click();

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
    const gitRepoEditPage = new GitRepoEditPo(localWorkspace, repoName);
    const description = `${ repoName }-desc`;

    fleetDashboardPage.goTo();
    fleetDashboardPage.waitForPage();
    fleetDashboardPage.sortableTable().rowActionMenuOpen(repoName).getMenuItem('Edit Config').click();

    gitRepoEditPage.waitForPage('mode=edit');
    gitRepoEditPage.nameNsDescription().description().set(description);
    gitRepoEditPage.footer().nextPage();
    gitRepoEditPage.footer().save();
    fleetDashboardPage.waitForPage();
  });

  after(() => {
    if (removeGitRepo) {
      // delete gitrepo
      reposToDelete.forEach((r) => cy.deleteRancherResource('v1', 'fleet.cattle.io.gitrepo', r));
    }
  });
});
