import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import { FleetGitRepoListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.gitrepo.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import { gitRepoCreateRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';

const fakeProvClusterId = 'some-fake-cluster-id';
const fakeMgmtClusterId = 'some-fake-mgmt-id';

describe('Git Repo', { tags: ['@fleet', '@adminUser'] }, () => {
  describe('Create', () => {
    const gitRepoCreatePage = new GitRepoCreatePo('_');
    const repoList = [];

    before(() => {
      cy.login();

      // generate a fake cluster that can be usable in fleet
      generateFakeClusterDataAndIntercepts(fakeProvClusterId, fakeMgmtClusterId);
    });

    it('Should be able to create a git repo', () => {
      cy.intercept('POST', '/v1/secrets/fleet-default').as('interceptSecret');
      cy.intercept('POST', '/v1/fleet.cattle.io.gitrepos').as('interceptGitRepo');
      cy.intercept('GET', '/v1/secrets?exclude=metadata.managedFields').as('getSecrets');

      gitRepoCreatePage.goTo();
      gitRepoCreatePage.waitForPage();
      cy.wait('@getSecrets').its('response.statusCode').should('eq', 200);

      const { name } = gitRepoCreateRequest.metadata;
      const {
        repo, branch, paths, helmRepoURLRegex
      } = gitRepoCreateRequest.spec;

      gitRepoCreatePage.setRepoName(name);
      gitRepoCreatePage.setGitRepoUrl(repo);
      gitRepoCreatePage.selectWorkspace('fleet-default');
      gitRepoCreatePage.setBranchName(branch);
      gitRepoCreatePage.helmAuthSelectOrCreate().createBasicAuth('test', 'test');
      gitRepoCreatePage.setHelmRepoURLRegex(helmRepoURLRegex);

      gitRepoCreatePage.gitRepoPaths().setValueAtIndex(paths[0], 0);
      gitRepoCreatePage.goToNext();

      gitRepoCreatePage.targetCluster().toggle();
      gitRepoCreatePage.targetCluster().clickOption(6);
      gitRepoCreatePage.create();

      repoList.push(name);

      // First request is for creating credentials
      let secretName = '';

      cy.wait('@interceptSecret')
        .then(({ request, response }) => {
          expect(response.statusCode).to.eq(201);
          secretName = response.body.metadata.name;
          expect(secretName).not.to.eq('');

          // Second request is for creating the git repo
          return cy.wait('@interceptGitRepo');
        })
        .then(({ request, response }) => {
          gitRepoCreateRequest.spec.helmSecretName = secretName;
          expect(response.statusCode).to.eq(201);
          expect(request.body).to.deep.eq(gitRepoCreateRequest);

          const listPage = new FleetGitRepoListPagePo();

          listPage.waitForPage();

          const prefPage = new PreferencesPagePo();

          // START TESTING https://github.com/rancher/dashboard/issues/9984
          // change language to chinese
          prefPage.goTo();
          prefPage.languageDropdownMenu().checkVisible();
          prefPage.languageDropdownMenu().toggle();
          prefPage.languageDropdownMenu().isOpened();
          prefPage.languageDropdownMenu().clickOption(2);
          prefPage.languageDropdownMenu().isClosed();

          listPage.goTo();
          listPage.waitForPage();

          // TESTING https://github.com/rancher/dashboard/issues/9984 make sure details page loads fine
          listPage.goToDetailsPage('fleet-e2e-test-gitrepo');
          gitRepoCreatePage.title().contains('Git 仓库: fleet-e2e-test-gitrepo').should('be.visible');
        })
      ;
    });

    after(() => {
      const prefPage = new PreferencesPagePo();

      // https://github.com/rancher/dashboard/issues/9984 reset lang to EN so that delete action can be performed
      prefPage.goTo();
      prefPage.languageDropdownMenu().checkVisible();
      prefPage.languageDropdownMenu().toggle();
      prefPage.languageDropdownMenu().isOpened();
      prefPage.languageDropdownMenu().clickOption(1);
      prefPage.languageDropdownMenu().isClosed();

      const fleetDashboardPage = new FleetDashboardPagePo('_');

      FleetDashboardPagePo.goTo();
      const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-default');

      fleetLocalResourceTable.sortableTable().deleteItemWithUI('fleet-e2e-test-gitrepo');
    });
  });
});
