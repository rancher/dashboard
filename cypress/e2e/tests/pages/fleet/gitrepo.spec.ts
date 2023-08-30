import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';
import { gitRepoCreateRequest } from '@/cypress/e2e/blueprints/fleet/gitrepos';

describe('Git Repo', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Create', () => {
    let gitRepoCreatePage: GitRepoCreatePo;
    const repoList = [];

    beforeEach(() => {
      gitRepoCreatePage = new GitRepoCreatePo('local');
      cy.interceptAllRequests('POST');

    });

    it('Should be able to create a git repo', () => {
      const { name, } = gitRepoCreateRequest.metadata;
      const { repo, branch, paths, helmRepoURLRegex } = gitRepoCreateRequest.spec;

      gitRepoCreatePage.goTo();
      gitRepoCreatePage.setRepoName(name);
      gitRepoCreatePage.setGitRepoUrl(repo);
      gitRepoCreatePage.setBranchName(branch);
      gitRepoCreatePage.gitRepoPaths().setValueAtIndex(paths[0], 0);
      gitRepoCreatePage.setHelmRepoURLRegex(helmRepoURLRegex);
      gitRepoCreatePage.goToNext();
      gitRepoCreatePage.create();

      repoList.push(name);
    });

    it('Should be able to create a gitrepo with helm credentials and regex', () => {

      cy.wait('@interceptAllRequests0').then(({ request, response }) => {
        expect(request.body).to.deep.eq(gitRepoCreateRequest);
        expect(response.statusCode).to.eq(201);
        expect(response.body.metadata.name).to.eq(name);
        expect(response.body.metadata.namespace).to.eq(namespace);
      });

      cy.wait('@interceptAllRequests1').then(({ request, response }) => {
        expect(request.body).to.deep.eq(gitRepoCreateRequest);
        expect(response.statusCode).to.eq(201);
      });

    })

    after(() => {
      const fleetDashboardPage = new FleetDashboardPagePo('local');

      fleetDashboardPage.goTo();
      const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-default');

      fleetLocalResourceTable.sortableTable().deleteItemWithUI('fleet-e2e-test-gitrepo');
    });
  });
});
