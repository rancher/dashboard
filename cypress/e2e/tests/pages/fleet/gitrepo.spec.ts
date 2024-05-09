import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import { FleetGitRepoListPagePo } from '@/cypress/e2e/po/pages/fleet/fleet.cattle.io.gitrepo.po';
import FleetGitRepoDetailsPo from '@/cypress/e2e/po/detail/fleet/fleet.cattle.io.gitrepo.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import { gitRepoCreateRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';
import { generateFakeClusterDataAndIntercepts } from '@/cypress/e2e/blueprints/nav/fake-cluster';
import PreferencesPagePo from '@/cypress/e2e/po/pages/preferences.po';
import PromptRemove from '@/cypress/e2e/po/prompts/promptRemove.po';

const fakeProvClusterId = 'some-fake-cluster-id';
const fakeMgmtClusterId = 'some-fake-mgmt-id';

describe('Git Repo', { tags: ['@fleet', '@adminUser'] }, () => {
  describe('Create', () => {
    const gitRepoCreatePage = new GitRepoCreatePo('_');
    const repoList = [];

    beforeEach(() => {
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

          cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdateZhHans`);
          prefPage.languageDropdownMenu().clickOption(2);
          cy.wait('@prefUpdateZhHans').then(({ response }) => {
            expect(response?.statusCode).to.eq(200);
            expect(response?.body.data).to.have.property('locale', 'zh-hans');
          });
          prefPage.languageDropdownMenu().isClosed();

          listPage.goTo();
          listPage.waitForPage();

          // TESTING https://github.com/rancher/dashboard/issues/9984 make sure details page loads fine
          listPage.goToDetailsPage('fleet-e2e-test-gitrepo');
          gitRepoCreatePage.title().contains('Git 仓库: fleet-e2e-test-gitrepo').should('be.visible');

          // https://github.com/rancher/dashboard/issues/9984 reset lang to EN so that delete action can be performed
          prefPage.goTo();
          prefPage.languageDropdownMenu().checkVisible();
          prefPage.languageDropdownMenu().toggle();
          prefPage.languageDropdownMenu().isOpened();

          cy.intercept('PUT', 'v1/userpreferences/*').as(`prefUpdateEnUs`);
          prefPage.languageDropdownMenu().clickOption(1);
          cy.wait('@prefUpdateEnUs').then(({ response }) => {
            expect(response?.statusCode).to.eq(200);
            expect(response?.body.data).to.have.property('locale', 'en-us');
          });
          prefPage.languageDropdownMenu().isClosed();
        })
      ;
    });

    // testing https://github.com/rancher/dashboard/issues/9866
    it('in git repo details view we should display the correct bundle count', () => {
      const listPage = new FleetGitRepoListPagePo();

      const basicRepos = [
        {
          name:   'e2e-git-repo1-test-bundle-count',
          repo:   'https://github.com/rancher/fleet-examples.git',
          branch: 'master',
          path:   'simple'
        },
        {
          name:   'e2e-git-repo2-test-bundle-count',
          repo:   'https://github.com/rancher/fleet-examples.git',
          branch: 'master',
          path:   'single-cluster/helm'
        }
      ];

      // create first git-repo in fleet-local
      gitRepoCreatePage.goTo();
      gitRepoCreatePage.waitForPage();

      gitRepoCreatePage.selectWorkspace('fleet-local');

      gitRepoCreatePage.setRepoName(basicRepos[0].name);
      gitRepoCreatePage.setGitRepoUrl(basicRepos[0].repo);
      gitRepoCreatePage.setBranchName(basicRepos[0].branch);
      gitRepoCreatePage.gitRepoPaths().setValueAtIndex(basicRepos[0].path, 0);
      gitRepoCreatePage.goToNext();
      gitRepoCreatePage.create();

      // create second git-repo in fleet-local
      listPage.waitForPage();
      listPage.repoList().create();

      gitRepoCreatePage.selectWorkspace('fleet-local');

      gitRepoCreatePage.setRepoName(basicRepos[1].name);
      gitRepoCreatePage.setGitRepoUrl(basicRepos[1].repo);
      gitRepoCreatePage.setBranchName(basicRepos[1].branch);
      gitRepoCreatePage.gitRepoPaths().setValueAtIndex(basicRepos[1].path, 0);
      gitRepoCreatePage.goToNext();
      gitRepoCreatePage.create();

      listPage.waitForPage();
      listPage.selectWorkspace('fleet-local');

      listPage.goToDetailsPage(basicRepos[1].name);

      const gitRepoDetails = new FleetGitRepoDetailsPo('fleet-local', basicRepos[1].name);

      gitRepoDetails.waitForPage();
      gitRepoDetails.gitRepoTabs().clickTabWithSelector('#bundles');
      gitRepoDetails.bundlesCount().should('contain', '1');
    });

    after(() => {
      const fleetDashboardPage = new FleetDashboardPagePo('_');

      FleetDashboardPagePo.goTo();
      const fleetDefaultResourceTable = fleetDashboardPage.resourceTable('fleet-default');

      fleetDefaultResourceTable.sortableTable().deleteItemWithUI('fleet-e2e-test-gitrepo');

      const listPage = new FleetGitRepoListPagePo();

      listPage.navTo();
      listPage.selectWorkspace('fleet-local');

      listPage.resourceTable().sortableTable().rowSelectCtlWithName('e2e-git-repo1-test-bundle-count').set();
      listPage.resourceTable().sortableTable().rowSelectCtlWithName('e2e-git-repo2-test-bundle-count').set();
      listPage.resourceTable().sortableTable().bulkActionDropDownOpen();
      listPage.resourceTable().sortableTable().bulkActionDropDownButton('Delete').click();

      const promptRemove = new PromptRemove();

      promptRemove.remove();
    });
  });
});
