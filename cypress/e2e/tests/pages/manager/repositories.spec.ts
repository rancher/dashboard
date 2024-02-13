import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import ChartRepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

describe('Cluster Management Helm Repositories', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const repositoriesPage = new ChartRepositoriesPagePo('_', 'manager');
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
    repositoriesPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields');
    repositoriesPage.create();
    repositoriesPage.createEditRepositories().waitForPage();
    repositoriesPage.createEditRepositories().nameNsDescription().name().set(this.repoName);
    repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-description`);
    repositoriesPage.createEditRepositories().repoRadioBtn().set(1);
    repositoriesPage.createEditRepositories().gitRepoUrl().set('https://git.rancher.io/charts');
    repositoriesPage.createEditRepositories().gitBranch().set('release-v2.8');
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(this.repoName, 2).should('be.visible');
    repositoriesPage.list().details(this.repoName, 1).contains('In Progress').should('be.visible');
    repositoriesPage.list().details(this.repoName, 1).contains('Active').should('be.visible');
  });

  it('can refresh a repository', function() {
    ChartRepositoriesPagePo.navTo();
    cy.intercept('PUT', `/v1/catalog.cattle.io.clusterrepos/${ this.repoName }`).as('refreshRepo');
    repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Refresh').click();
    cy.wait('@refreshRepo').its('response.statusCode').should('eq', 200);

    // check list details
    repositoriesPage.list().details(this.repoName, 1).contains('In Progress').should('be.visible');
    repositoriesPage.list().details(this.repoName, 1).contains('Active').should('be.visible');
  });

  it('can edit a repository', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Edit Config').click();
    repositoriesPage.createEditRepositories(this.repoName).waitForPage('mode=edit');
    repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-desc-edit`);
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('PUT', `/v1/catalog.cattle.io.clusterrepos/${ this.repoName }`);
    repositoriesPage.waitForPage();

    // check details page
    repositoriesPage.list().details(this.repoName, 2).click();
    cy.contains(`${ this.repoName }-desc-edit`).should('be.visible');
  });

  it('can clone a repository', function() {
    ChartRepositoriesPagePo.navTo();
    repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Clone').click();
    repositoriesPage.createEditRepositories(this.repoName).waitForPage('mode=clone');
    repositoriesPage.createEditRepositories().nameNsDescription().name().set(`${ this.repoName }-clone`);
    repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-desc-clone`);
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(`${ this.repoName }-clone`, 2).should('be.visible');
  });

  it('can download YAML', function() {
    ChartRepositoriesPagePo.navTo();
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

  it('can delete a repository', function() {
    ChartRepositoriesPagePo.navTo();

    // delete original cloned Repository
    repositoriesPage.list().actionMenu(`${ this.repoName }-clone`).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ this.repoName }-clone`).as('deleteRepository');

    promptRemove.remove();
    cy.wait('@deleteRepository');
    repositoriesPage.waitForPage();

    // check list details
    cy.contains(`${ this.repoName }-clone`).should('not.exist');
  });

  it('can delete a repository via bulk actions', function() {
    ChartRepositoriesPagePo.navTo();

    // delete original Repository
    repositoriesPage.list().resourceTable().sortableTable().rowSelectCtlWithName(this.repoName)
      .set();
    repositoriesPage.list().openBulkActionDropdown();

    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ this.repoName }`).as('deleteRepository');
    repositoriesPage.list().bulkActionButton('Delete').click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
    cy.wait('@deleteRepository');
    repositoriesPage.waitForPage();

    // check list details
    cy.contains(this.repoName).should('not.exist');
  });
});
