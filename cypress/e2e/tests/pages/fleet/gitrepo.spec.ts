import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import { gitRepoCreateRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';

describe('Git Repo', { tags: ['@fleet', '@adminUser'] }, () => {
  describe('Create', () => {
    const gitRepoCreatePage = new GitRepoCreatePo('local');
    const repoList = [];

    before(() => {
      cy.login();
    });

    it('Should be able to create a git repo', () => {
      cy.intercept('POST', '/v1/secrets/fleet-default').as('interceptSecret');
      cy.intercept('POST', '/v1/fleet.cattle.io.gitrepos').as('interceptGitRepo');

      GitRepoCreatePo.goTo();
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
        })
      ;
    });

    after(() => {
      const fleetDashboardPage = new FleetDashboardPagePo('local');

      FleetDashboardPagePo.navTo();
      const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-default');

      fleetLocalResourceTable.sortableTable().deleteItemWithUI('fleet-e2e-test-gitrepo');
    });
  });
});
