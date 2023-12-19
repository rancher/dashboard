import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import RepositoriesPagePo from '@/cypress/e2e/po/pages/cluster-manager/repositories.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';

describe('Repositories', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const repositoriesPage = new RepositoriesPagePo('_', 'manager');
  const runTimestamp = +new Date();
  const repoName = `e2e-repo-name-${ runTimestamp }`;
  const repoDescription = `e2e-repo-description-${ runTimestamp }`;
  const repoNameClone = `e2e-repo-name-${ runTimestamp }-clone`;

  const downloadsFolder = Cypress.config('downloadsFolder');

  before(() => {
    cy.login();
  });

  it('can create a repository', () => {
    RepositoriesPagePo.navTo();
    repositoriesPage.waitForPage();
    repositoriesPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields');
    repositoriesPage.create();
    repositoriesPage.createEditRepositories().waitForPage();
    repositoriesPage.createEditRepositories().name().set(repoName);
    repositoriesPage.createEditRepositories().description().set(repoDescription);
    repositoriesPage.createEditRepositories().repoRadioBtn().set(1);
    repositoriesPage.createEditRepositories().gitRepoUrl().set('https://git.rancher.io/charts');
    repositoriesPage.createEditRepositories().gitBranch().set('release-v2.8');
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(repoName, 2).should('be.visible');
    repositoriesPage.list().details(repoName, 1).contains('In Progress').should('be.visible');
    repositoriesPage.list().details(repoName, 1).contains('Active').should('be.visible');
  });

  it('can refresh a repository', () => {
    RepositoriesPagePo.navTo();
    cy.intercept('PUT', `/v1/catalog.cattle.io.clusterrepos/${ repoName }`).as('refreshRepo');
    repositoriesPage.list().actionMenu(repoName).getMenuItem('Refresh').click();
    cy.wait('@refreshRepo').its('response.statusCode').should('eq', 200);

    // check list details
    repositoriesPage.list().details(repoName, 1).contains('In Progress').should('be.visible');
    repositoriesPage.list().details(repoName, 1).contains('Active').should('be.visible');
  });

  it('can edit a repository', () => {
    RepositoriesPagePo.navTo();
    repositoriesPage.list().actionMenu(repoName).getMenuItem('Edit Config').click();
    repositoriesPage.createEditRepositories(repoName).waitForPage('mode=edit');
    repositoriesPage.createEditRepositories().description().set(`${ repoDescription }-edit`);

    repositoriesPage.createEditRepositories().saveAndWaitForRequests('PUT', `/v1/catalog.cattle.io.clusterrepos/${ repoName }`);
    repositoriesPage.waitForPage();

    // check details page
    repositoriesPage.list().details(repoName, 2).click();
    cy.contains(`${ repoDescription }-edit`).should('be.visible');
  });

  it('can clone a repository', () => {
    RepositoriesPagePo.navTo();
    repositoriesPage.list().actionMenu(repoName).getMenuItem('Clone').click();
    repositoriesPage.createEditRepositories(repoName).waitForPage('mode=clone');
    repositoriesPage.createEditRepositories().name().set(repoNameClone);
    repositoriesPage.createEditRepositories().description().set(`${ repoDescription }-clone`);
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(repoNameClone, 2).should('be.visible');
  });

  it('can download YAML', () => {
    RepositoriesPagePo.navTo();
    repositoriesPage.list().actionMenu(repoName).getMenuItem('Download YAML').click();

    const downloadedFilename = path.join(downloadsFolder, `${ repoName }.yaml`);

    cy.readFile(downloadedFilename).then((buffer) => {
      const obj: any = jsyaml.load(buffer);

      // Basic checks on the downloaded YAML
      expect(obj.apiVersion).to.equal('catalog.cattle.io/v1');
      expect(obj.metadata.name).to.equal(repoName);
      expect(obj.kind).to.equal('ClusterRepo');
    });
  });

  it('can delete a repository', () => {
    RepositoriesPagePo.navTo();

    // delete original cloned Repository
    repositoriesPage.list().actionMenu(repoNameClone).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ repoNameClone }`).as('deleteRepository');

    promptRemove.remove();
    cy.wait('@deleteRepository');
    repositoriesPage.waitForPage();

    // check list details
    cy.contains(repoNameClone).should('not.exist');
  });

  it('can delete a repository via bulk actions', () => {
    RepositoriesPagePo.navTo();

    // delete original Repository
    repositoriesPage.list().resourceTable().sortableTable().rowSelectCtlWithName(repoName)
      .set();
    repositoriesPage.list().openBulkActionDropdown();

    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ repoName }`).as('deleteRepository');
    repositoriesPage.list().bulkActionButton('Delete').click();

    const promptRemove = new PromptRemove();

    promptRemove.remove();
    cy.wait('@deleteRepository');
    repositoriesPage.waitForPage();

    // check list details
    cy.contains(repoName).should('not.exist');
  });
});
