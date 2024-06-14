import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import { gitRepoCreateRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';

describe('Git Repo', { tags: ['@fleet', '@adminUser'] }, () => {
  describe('Create', () => {
    let gitRepoCreatePage: GitRepoCreatePo;
    const repoList = [];

    before(() => {
      cy.login();
      gitRepoCreatePage = new GitRepoCreatePo('local');
      cy.interceptAllRequests('POST');
      gitRepoCreatePage.goTo();
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
    });

    it('Should be able to create a git repo', () => {
      // First request is for creating credentials
      let secretName = '';
      let requestLabels = null;
      let secretLabels = null;

      cy.wait('@interceptAllRequests0').then(({ request, response }) => {
        requestLabels = request.body.metadata.labels;
        expect(requestLabels).to.be.an('object').and.to.have.property('fleet.cattle.io/managed').that.equals('true');
        expect(response.statusCode).to.eq(201);
        secretName = response.body.metadata.name;
        secretLabels = response.body.metadata.labels;
        expect(secretName).not.to.eq('');
        expect(secretLabels).to.be.an('object').and.to.have.property('fleet.cattle.io/managed').that.equals('true');
      });

      // Second request is for creating the git repo
      cy.wait('@interceptAllRequests0').then(({ request, response }) => {
        gitRepoCreateRequest.spec.helmSecretName = secretName;
        expect(response.statusCode).to.eq(201);
        expect(request.body).to.deep.eq(gitRepoCreateRequest);
      });
    });

    after(() => {
      const fleetDashboardPage = new FleetDashboardPagePo('local');

      fleetDashboardPage.goTo();
      const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-default');

      fleetLocalResourceTable.sortableTable().deleteItemWithUI('fleet-e2e-test-gitrepo');
    });
  });
});
