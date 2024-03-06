import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import ChartRepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';

describe('Cluster Management Helm Repositories', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const repositoriesPage = new ChartRepositoriesPagePo(undefined, 'manager');

  before(() => {
    cy.login();
  });

  beforeEach(() => {
    cy.createE2EResourceName('repo').as('repoName');
  });

  it('can create a repository with basic auth', function() {
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
    repositoriesPage.createEditRepositories().clusterrepoAuthSelectOrCreate().createBasicAuth('test', 'test');
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(this.repoName, 2).should('be.visible');
    repositoriesPage.list().details(this.repoName, 1).contains('In Progress').should('be.visible');
    repositoriesPage.list().actionMenu(`${ this.repoName }`).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ this.repoName }`).as('deleteRepository');

    promptRemove.remove();
    cy.wait('@deleteRepository');
    repositoriesPage.waitForPage();

    // check list details
    cy.contains(`${ this.repoName }`).should('not.exist');
  });

  it('can create a repository with SSH key', function() {
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
    repositoriesPage.createEditRepositories().clusterrepoAuthSelectOrCreate().createSSHAuth('privateKey', 'publicKey');
    repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
    repositoriesPage.waitForPage();

    // check list details
    repositoriesPage.list().details(this.repoName, 2).should('be.visible');

    repositoriesPage.list().actionMenu(`${ this.repoName }`).getMenuItem('Delete').click();

    const promptRemove = new PromptRemove();

    cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ this.repoName }`).as('deleteRepository');

    promptRemove.remove();
    cy.wait('@deleteRepository');
    repositoriesPage.waitForPage();

    // check list details
    cy.contains(`${ this.repoName }`).should('not.exist');
  });
});
