import { CURRENT_RANCHER_VERSION } from '@shell/config/version.js';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import ChartRepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { LONG_TIMEOUT_OPT, MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

const chartBranch = `release-v${ CURRENT_RANCHER_VERSION }`;
const gitRepoUrl = 'https://github.com/rancher/charts';

describe('Visual Testing', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });
  it('validating repositories page with percy', () => {
    const repositoriesPage = new ChartRepositoriesPagePo(undefined, 'manager');

    ChartRepositoriesPagePo.navTo();
    repositoriesPage.list().resourceTable().sortableTable().checkVisible();
    repositoriesPage.list().resourceTable().sortableTable().checkLoadingIndicatorNotVisible();
    repositoriesPage.waitForPage();

    // Ignoring the user profile picture
    cy.hideElementBySelector('[data-testid="nav_header_showUserMenu"]');
    // Ignore dinamic data inside rows 5 y 4(age and branch)
    cy.hideElementBySelector("[data-testid^='sortable-cell-'][data-testid$='-5']");
    cy.hideElementBySelector("[data-testid^='sortable-cell-'][data-testid$='-4']");
    // Ignoring the side navbar counters
    cy.hideElementBySelector("[data-testid='type-count']");
    // takes percy snapshot.
    cy.percySnapshot('repositories Page');
  });
});

describe('Cluster Management Helm Repositories', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const repositoriesPage = new ChartRepositoriesPagePo(undefined, 'manager');
  const downloadsFolder = Cypress.config('downloadsFolder');

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.createE2EResourceName('repo').as('repoName');
  });

  it('can create a repository', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();

    repositoriesPage.create();
    repositoriesPage.createEditRepositories().waitForPage();
    repositoriesPage.createEditRepositories().nameNsDescription().name().set(this.repoName);
    repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-description`);
    repositoriesPage.createEditRepositories().repoRadioBtn().set(1);
    repositoriesPage.createEditRepositories().gitRepoUrl().set(gitRepoUrl);
    repositoriesPage.createEditRepositories().gitBranch().set(chartBranch);
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', CLUSTER_REPOS_BASE_URL).its('response.statusCode').should('eq', 201);
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(this.repoName, 2).should('be.visible');
    repositoriesPage.list().details(this.repoName, 1).contains('In Progress').should('be.visible');
    cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', this.repoName);
    repositoriesPage.list().details(this.repoName, 1).contains('Active', LONG_TIMEOUT_OPT).should('be.visible');
  });

  it('can edit a repository', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Edit Config').click();
    repositoriesPage.createEditRepositories(this.repoName).waitForPage('mode=edit');
    repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-desc-edit`);
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ this.repoName }`);
    repositoriesPage.waitForPage();

    // check details page
    repositoriesPage.list().details(this.repoName, 2).click();
    cy.contains(`${ this.repoName }-desc-edit`).should('be.visible');
  });

  it('can clone a repository', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Clone').click();
    repositoriesPage.createEditRepositories(this.repoName).waitForPage('mode=clone');
    repositoriesPage.createEditRepositories().nameNsDescription().name().set(`${ this.repoName }-clone`);
    repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-desc-clone`);
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', CLUSTER_REPOS_BASE_URL);
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(`${ this.repoName }-clone`, 2).should('be.visible');
  });

  it('can download YAML', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Download YAML').click({ force: true });

    const downloadedFilename = path.join(downloadsFolder, `${ this.repoName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('catalog.cattle.io/v1');
      expect(obj.metadata.name).to.equal(this.repoName);
      expect(obj.kind).to.equal('ClusterRepo');
    });
  });

  it('can refresh a repository', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    cy.intercept('PUT', `${ CLUSTER_REPOS_BASE_URL }/${ this.repoName }`).as('refreshRepo');
    repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Refresh').click({ force: true });
    cy.wait('@refreshRepo').its('response.statusCode').should('eq', 200);

    // check list details
    repositoriesPage.list().details(this.repoName, 1).contains('In Progress').should('be.visible');
    repositoriesPage.list().details(this.repoName, 1).contains('Active', LONG_TIMEOUT_OPT).should('be.visible');
  });

  it('can delete a repository', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();

    // delete cloned Repository
    repositoriesPage.list().resourceTable().sortableTable().rowNames()
      .then((names) => {
        if (names.filter((name) => name === `${ this.repoName }-clone`).length > 1) {
          cy.reload(); // need page reload here in case multiple entries are created. reload should resolve the duplicate issue
        }
      });

    repositoriesPage.list().actionMenu(`${ this.repoName }-clone`).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ this.repoName }-clone`).as('deleteRepository');

    promptRemove.remove();
    cy.wait('@deleteRepository');
    repositoriesPage.waitForPage();

    // check list details
    cy.contains(`${ this.repoName }-clone`).should('not.exist');
  });

  it('can create a repository with basic auth', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    repositoriesPage.create();
    repositoriesPage.createEditRepositories().waitForPage();
    repositoriesPage.createEditRepositories().nameNsDescription().name().set(`${ this.repoName }basic`);
    repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-description`);
    repositoriesPage.createEditRepositories().repoRadioBtn().set(1);
    repositoriesPage.createEditRepositories().gitRepoUrl().set(gitRepoUrl);
    repositoriesPage.createEditRepositories().gitBranch().set(chartBranch);
    repositoriesPage.createEditRepositories().clusterRepoAuthSelectOrCreate().createBasicAuth('test', 'test');
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', CLUSTER_REPOS_BASE_URL);
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(`${ this.repoName }basic`, 2).should('be.visible');
    repositoriesPage.list().details(`${ this.repoName }basic`, 1).contains('Active', LONG_TIMEOUT_OPT).should('be.visible');
  });

  it('can create a repository with SSH key', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    repositoriesPage.create();
    repositoriesPage.createEditRepositories().waitForPage();
    repositoriesPage.createEditRepositories().nameNsDescription().name().set(`${ this.repoName }ssh`);
    repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-description`);
    repositoriesPage.createEditRepositories().repoRadioBtn().set(1);
    repositoriesPage.createEditRepositories().gitRepoUrl().set(gitRepoUrl);
    repositoriesPage.createEditRepositories().gitBranch().set(chartBranch);
    repositoriesPage.createEditRepositories().clusterRepoAuthSelectOrCreate().createSSHAuth('privateKey', 'publicKey');
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', CLUSTER_REPOS_BASE_URL);
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(`${ this.repoName }ssh`, 2).should('be.visible');
    repositoriesPage.list().details(`${ this.repoName }ssh`, 1).contains('Active').should('be.visible');
  });

  it('can delete repositories via bulk actions', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();

    // delete Repositories
    repositoriesPage.list().resourceTable().sortableTable().rowNames()
      .then((names) => {
        if (names.filter((name1) => name1 === (this.repoName || `${ this.repoName }basic` || `${ this.repoName }ssh`)).length > 1) {
          cy.reload(); // need page reload here in case multiple entries are created. reload should resolve the duplicate issue
        }
      });

    repositoriesPage.list().resourceTable().sortableTable().rowSelectCtlWithName(this.repoName)
      .set();
    repositoriesPage.list().resourceTable().sortableTable().rowSelectCtlWithName(`${ this.repoName }basic`)
      .set();
    repositoriesPage.list().resourceTable().sortableTable().rowSelectCtlWithName(`${ this.repoName }ssh`)
      .set();
    repositoriesPage.list().openBulkActionDropdown();

    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ this.repoName }`).as('deleteRepository');
    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ this.repoName }basic`).as('deleteRepositoryBasic');
    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ this.repoName }ssh`).as('deleteRepositorySsh');

    repositoriesPage.list().bulkActionButton('Delete').click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
    cy.wait('@deleteRepository');
    cy.wait('@deleteRepositoryBasic');
    cy.wait('@deleteRepositorySsh');
    repositoriesPage.waitForPage();

    // check list details
    cy.contains(this.repoName).should('not.exist');
    cy.contains(`${ this.repoName }basic`).should('not.exist');
    cy.contains(`${ this.repoName }ssh`).should('not.exist');
  });

  it('can create an oci repository with basic auth', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    repositoriesPage.waitForGoTo(`${ CLUSTER_REPOS_BASE_URL }?*`);
    repositoriesPage.create();
    repositoriesPage.createEditRepositories().waitForPage();
    const ociUrl = 'oci://test.rancher.io/charts/mychart';
    const ociMinWait = '2';
    const ociMaxWait = '7';
    const refreshInterval = '12';

    repositoriesPage.createEditRepositories().nameNsDescription().name().set(this.repoName);
    repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-description`);
    repositoriesPage.createEditRepositories().repoRadioBtn().set(2);
    repositoriesPage.createEditRepositories().ociUrl().set(ociUrl);
    repositoriesPage.createEditRepositories().refreshIntervalInput().setValue(refreshInterval);
    repositoriesPage.createEditRepositories().clusterRepoAuthSelectOrCreate().createBasicAuth('test', 'test');
    repositoriesPage.createEditRepositories().ociMinWaitInput().setValue(ociMinWait);
    // setting a value and removing it so in the intercept we test that the key(e.g. maxWait) is not included in the request
    repositoriesPage.createEditRepositories().ociMaxWaitInput().setValue(ociMaxWait);
    repositoriesPage.createEditRepositories().ociMaxWaitInput().clear();

    cy.intercept('POST', CLUSTER_REPOS_BASE_URL).as('createRepository');

    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', CLUSTER_REPOS_BASE_URL);

    cy.wait('@createRepository', { requestTimeout: 10000 }).then((req) => {
      expect(req.response?.statusCode).to.equal(201);
      expect(req.request?.body?.spec.url).to.equal(ociUrl);
      expect(req.request?.body?.spec.exponentialBackOffValues.minWait).to.equal(Number(ociMinWait));
      expect(req.request?.body?.spec.exponentialBackOffValues.maxWait).to.equal(undefined);
      // insecurePlainHttp should always be included in the payload for oci repo creation
      expect(req.request?.body?.spec.insecurePlainHttp).to.equal(false);
      // check refreshInterval
      expect(req.request?.body?.spec.refreshInterval).to.equal(Number(refreshInterval));
    });

    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(this.repoName, 2).should('be.visible');

    // delete repo
    cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', this.repoName);
  });
});

describe('Repository Disable/Enable', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const repositoriesPage = new ChartRepositoriesPagePo(undefined, 'manager');
  let repoName: string;

  before(() => {
    cy.login();
    // The context menu can slightly clip at the top of the screen. This ensures it's visible.
    cy.viewport(1280, 720);

    cy.createE2EResourceName('repo').then((name) => {
      repoName = name;
      cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
        type:     'catalog.cattle.io.clusterrepo',
        metadata: { name },
        spec:     {
          gitRepo:   gitRepoUrl,
          gitBranch: chartBranch
        }
      }).then(() => {
        // Wait for repository to be downloaded and ready
        cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', name);
      });
    });
  });

  it('can disable a repository', () => {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    cy.waitForResourceState('v1', 'catalog.cattle.io.clusterrepos', repoName).then(() => {
      // Check if repository is already disabled, if so skip
      repositoriesPage.list().details(repoName, 1).then(($el) => {
        if ($el.text().includes('Disabled')) {
          cy.log(`Repository ${ repoName } is already disabled, skipping disable action`);

          return;
        }

        repositoriesPage.list().actionMenu(repoName).getMenuItem('Disable').click();
        repositoriesPage.list().details(repoName, 1).contains('Disabled').should('be.visible');
      });
    });
  });

  it('refresh menu item is not displayed for disabled repository', () => {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    repositoriesPage.list().details(repoName, 1).contains('Disabled').should('be.visible');

    // Open the action menu first
    repositoriesPage.list().actionMenu(repoName);

    // Wait for action menu to be visible and populated
    cy.get('[dropdown-menu-collection]:visible').should('be.visible');
    cy.get('[dropdown-menu-item]').should('have.length.at.least', 1);

    // Verify refresh is not displayed for disabled repo - check directly in dropdown
    cy.get('[dropdown-menu-collection]:visible').within(() => {
      cy.get('[dropdown-menu-item]').contains('Refresh').should('not.exist');
    });

    // Close action menu
    repositoriesPage.list().actionMenuClose(repoName);
  });

  it('can enable a repository', () => {
    // Ensure repository exists before enabling
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    cy.waitForResourceState('v1', 'catalog.cattle.io.clusterrepos', repoName).then(() => {
      // Check if repository is already enabled, if so skip
      repositoriesPage.list().details(repoName, 1).then(($el) => {
        if ($el.text().includes('Active')) {
          cy.log(`Repository ${ repoName } is already enabled, skipping enable action`);

          return;
        }

        repositoriesPage.list().actionMenu(repoName).getMenuItem('Enable').click();
        repositoriesPage.list().details(repoName, 1).contains('Active', MEDIUM_TIMEOUT_OPT).should('be.visible');
      });
    });
  });

  after(() => {
    if (repoName) {
      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', repoName, false);
    }
  });
});
