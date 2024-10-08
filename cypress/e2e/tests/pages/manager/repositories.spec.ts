import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';
import ChartRepositoriesPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import * as path from 'path';
import * as jsyaml from 'js-yaml';
import { EXTRA_LONG_TIMEOUT_OPT, LONG_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';

const chartBranch = 'release-v2.9';

describe('Cluster Management Helm Repositories', { testIsolation: 'off', tags: ['@manager', '@adminUser'] }, () => {
  const repositoriesPage = new ChartRepositoriesPagePo(undefined, 'manager');
  const downloadsFolder = Cypress.config('downloadsFolder');
  const testRepos = [];

  before(() => {
    cy.login();
  });

  describe('Create', () => {
    beforeEach(() => {
      cy.createE2EResourceName('repo').as('repoName');
      cy.get('@repoName').then((name) => testRepos.push(name));
    });

    it('can create a repository', function() {
      ChartRepositoriesPagePo.navTo();
      repositoriesPage.waitForPage();
      repositoriesPage.create();
      repositoriesPage.createEditRepositories().waitForPage();
      repositoriesPage.createEditRepositories().nameNsDescription().name().set(this.repoName);
      repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-description`);
      repositoriesPage.createEditRepositories().repoRadioBtn().set(1);
      repositoriesPage.createEditRepositories().gitRepoUrl().set('https://github.com/rancher/charts');
      repositoriesPage.createEditRepositories().gitBranch().set(chartBranch);
      repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos').its('response.statusCode').should('eq', 201);
      repositoriesPage.waitForPage();

      // check list details
      repositoriesPage.list().details(this.repoName, 2).should('be.visible');
      repositoriesPage.list().details(this.repoName, 1).contains('In Progress').should('be.visible');
      repositoriesPage.list().details(this.repoName, 1).contains('Active', LONG_TIMEOUT_OPT).should('be.visible');
    });

    it('can create a repository with basic auth', function() {
      ChartRepositoriesPagePo.navTo();
      repositoriesPage.waitForPage();
      repositoriesPage.create();
      repositoriesPage.createEditRepositories().waitForPage();
      repositoriesPage.createEditRepositories().nameNsDescription().name().set(`${ this.repoName }`);
      repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-description`);
      repositoriesPage.createEditRepositories().repoRadioBtn().set(1);
      repositoriesPage.createEditRepositories().gitRepoUrl().set('https://github.com/rancher/charts');
      repositoriesPage.createEditRepositories().gitBranch().set(chartBranch);
      repositoriesPage.createEditRepositories().clusterRepoAuthSelectOrCreate().createBasicAuth('test', 'test');
      repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
      repositoriesPage.waitForPage();

      // check list details
      repositoriesPage.list().details(`${ this.repoName }`, 2).should('be.visible');
      repositoriesPage.list().details(`${ this.repoName }`, 1).contains('Active', LONG_TIMEOUT_OPT).should('be.visible');
    });

    it('can create a repository with SSH key', function() {
      cy.intercept('POST', `/v1/secrets/**`).as('createSSHSecret');

      ChartRepositoriesPagePo.navTo();
      repositoriesPage.waitForPage();
      repositoriesPage.create();
      repositoriesPage.createEditRepositories().waitForPage();
      repositoriesPage.createEditRepositories().nameNsDescription().name().set(`${ this.repoName }`);
      repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-description`);
      repositoriesPage.createEditRepositories().repoRadioBtn().set(1);
      repositoriesPage.createEditRepositories().gitRepoUrl().set('https://github.com/rancher/charts');
      repositoriesPage.createEditRepositories().gitBranch().set(chartBranch);
      repositoriesPage.createEditRepositories().clusterRepoAuthSelectOrCreate().createSSHAuth('privateKey', 'publicKey');
      repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos').its('response.statusCode').should('eq', 201);
      cy.wait('@createSSHSecret').its('response.statusCode').should('eq', 201);

      repositoriesPage.waitForPage();

      // check list details
      repositoriesPage.list().details(`${ this.repoName }`, 2).should('be.visible');
    });

    it.skip('[Vue3 Skip]: can create an oci repository with basic auth', function() {
      ChartRepositoriesPagePo.navTo();
      repositoriesPage.waitForPage();
      repositoriesPage.waitForGoTo('/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields');
      repositoriesPage.create();
      repositoriesPage.createEditRepositories().waitForPage();
      const ociUrl = 'oci://test.rancher.io/charts/mychart';
      const ociMinWait = '2';
      const expectedOciMinWaitInPayload = 2;
      const ociMaxWait = '7';

      repositoriesPage.createEditRepositories().nameNsDescription().name().set(this.repoName);
      repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-description`);
      repositoriesPage.createEditRepositories().repoRadioBtn().set(2);
      repositoriesPage.createEditRepositories().ociUrl().set(ociUrl);
      repositoriesPage.createEditRepositories().clusterRepoAuthSelectOrCreate().createBasicAuth('test', 'test');
      repositoriesPage.createEditRepositories().ociMinWaitInput().set(ociMinWait);
      // setting a value and removing it so in the intercept we test that the key(e.g. maxWait) is not included in the request
      repositoriesPage.createEditRepositories().ociMaxWaitInput().set(ociMaxWait);
      repositoriesPage.createEditRepositories().ociMaxWaitInput().clear();

      cy.intercept('POST', '/v1/catalog.cattle.io.clusterrepos').as('createRepository');

      repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');

      cy.wait('@createRepository', { requestTimeout: 10000 }).then((req) => {
        expect(req.response?.statusCode).to.equal(201);
        expect(req.request?.body?.spec.url).to.equal(ociUrl);
        expect(req.request?.body?.spec.exponentialBackOffValues.minWait).to.equal(expectedOciMinWaitInPayload);
        expect(req.request?.body?.spec.exponentialBackOffValues.maxWait).to.equal(undefined);
        // insecurePlainHttp should always be included in the payload for oci repo creation
        expect(req.request?.body?.spec.insecurePlainHttp).to.equal(false);
      });

      repositoriesPage.waitForPage();

      // check list details
      repositoriesPage.list().details(this.repoName, 2).should('be.visible');

      repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ this.repoName }`).as('deleteRepository');

      promptRemove.remove();
      cy.wait('@deleteRepository');
      repositoriesPage.waitForPage();

      // check list details
      cy.contains(this.repoName).should('not.exist');
    });
  });

  describe('Cluster Management Helm Repository Read/Clone/Update/Delete', () => {
    beforeEach(() => {
      // const name = `e2e-repo-${ Math.random().toString(36).substr(2, 6) }`;

      // cy.wrap(name).as('repoName');
      // testRepos.push(name);
      // cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
      //   metadata: { name }, spec: { gitRepo: 'https://github.com/rancher/charts', gitBranch: 'release-v2.9' }, type: 'catalog.cattle.io.clusterrepo'
      // });

      cy.createE2EResourceName('repo').as('repoName');
      cy.get('@repoName').then((name) => {
        testRepos.push(name);

        cy.createRancherResource('v1', 'catalog.cattle.io.clusterrepos', {
          metadata: { name }, spec: { gitRepo: 'https://github.com/rancher/charts', gitBranch: 'release-v2.9' }, type: 'catalog.cattle.io.clusterrepo'
        });
      });
    });

    it('can refresh a repository', function() {
      ChartRepositoriesPagePo.navTo();
      repositoriesPage.waitForPage();
      cy.reload();
      // calling refresh before a repo is active doesn't work - force this test to wait for the beforeEach repo to come up
      repositoriesPage.list().details(this.repoName, 2).should('be.visible');
      repositoriesPage.list().details(this.repoName, 1).contains('Active', EXTRA_LONG_TIMEOUT_OPT).should('be.visible');

      cy.intercept('PUT', `/v1/catalog.cattle.io.clusterrepos/${ this.repoName }`).as('refreshRepo');
      repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Refresh').click();
      cy.wait('@refreshRepo').its('response.statusCode').should('eq', 200);

      // check list details
      repositoriesPage.list().details(this.repoName, 1).contains('In Progress').should('be.visible');
      repositoriesPage.list().details(this.repoName, 1).contains('Active', LONG_TIMEOUT_OPT).should('be.visible');
    });

    it('can edit a repository', function() {
      ChartRepositoriesPagePo.navTo();
      repositoriesPage.waitForPage();
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
      repositoriesPage.waitForPage();
      repositoriesPage.list().actionMenu(this.repoName).getMenuItem('Clone').click();
      repositoriesPage.createEditRepositories(this.repoName).waitForPage('mode=clone');
      repositoriesPage.createEditRepositories().nameNsDescription().name().set(`${ this.repoName }-clone`);
      repositoriesPage.createEditRepositories().nameNsDescription().description().set(`${ this.repoName }-desc-clone`);
      repositoriesPage.createEditRepositories().saveAndWaitForRequests('POST', '/v1/catalog.cattle.io.clusterrepos');
      repositoriesPage.waitForPage();

      // check list details
      repositoriesPage.list().details(`${ this.repoName }-clone`, 2).should('be.visible');
      testRepos.push(`${ this.repoName }-clone`);
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

    it('can delete a repository', () => {
      const toDelete = this.repoName || testRepos.pop();

      ChartRepositoriesPagePo.navTo();
      repositoriesPage.waitForPage();

      repositoriesPage.list().actionMenu(toDelete).getMenuItem('Delete').click();

      const promptRemove = new PromptRemove();

      cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ toDelete }`).as('deleteRepository');

      promptRemove.remove();
      cy.wait('@deleteRepository');
      repositoriesPage.waitForPage();

      // check list details
      cy.containsExactly(toDelete).should('not.exist');
    });

    it('can delete repositories via bulk actions', () => {
      ChartRepositoriesPagePo.navTo();
      repositoriesPage.waitForPage();

      const firstRepo = testRepos[0];
      const secondRepo = testRepos[1];

      repositoriesPage.list().resourceTable().sortableTable().rowSelectCtlWithName(firstRepo)
        .set();
      repositoriesPage.list().resourceTable().sortableTable().rowSelectCtlWithName(secondRepo)
        .set();

      repositoriesPage.list().openBulkActionDropdown();

      cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ firstRepo }`).as('bulkDeleteRepository1');
      cy.intercept('DELETE', `v1/catalog.cattle.io.clusterrepos/${ secondRepo }`).as('bulkDeleteRepository2');

      repositoriesPage.list().bulkActionButton('Delete').click();

      const promptRemove = new PromptRemove();

      promptRemove.remove();
      cy.wait('@bulkDeleteRepository1');
      cy.wait('@bulkDeleteRepository2');
      repositoriesPage.waitForPage();

      // check list details
      cy.containsExactly(firstRepo).should('not.exist');
      cy.containsExactly(secondRepo).should('not.exist');
    });
  });

  after('clean up cluster repos', () => {
    testRepos.forEach((repo) => {
      cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', repo, false);
    });
  });
});
