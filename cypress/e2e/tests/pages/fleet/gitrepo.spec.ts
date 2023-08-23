import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import { FleetDashboardPagePo } from '~/cypress/e2e/po/pages/fleet/fleet-dashboard.po';

describe('Git Repo', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

    const repoList = [];

  describe('Create', () => {
    let gitRepoCreatePage: GitRepoCreatePo;

    beforeEach(() => {
      gitRepoCreatePage = new GitRepoCreatePo('local');
    });

    it('Should be able to create a git repo', () => {
      gitRepoCreatePage.goTo();
      gitRepoCreatePage.setRepoName('fleet-e2e-test-gitrepo');
      gitRepoCreatePage.setGitRepoUrl('https://github.com/Shavindra/fleet-examples.git');
      gitRepoCreatePage.setBranchName();
      gitRepoCreatePage.gitRepoPaths().setValueAtIndex('simple', 0);
      gitRepoCreatePage.goToNext();
      gitRepoCreatePage.create();

      repoList.push('fleet-e2e-test-gitrepo');
    });

    it('Should be able to create a git repo with helm authentication', () => {

        cy.interceptAllRequests('POST');


        cy.wait('@interceptAllRequests0').then(({ request, response }) => {
          expect(request.body).to.deep.eq(deploymentCreateRequest);
          expect(response.statusCode).to.eq(201);
          expect(response.body.metadata.name).to.eq(name);
          expect(response.body.metadata.namespace).to.eq(namespace);
        });

        
      gitRepoCreatePage.goTo();
      gitRepoCreatePage.setRepoName('fleet-e2e-test-auth');

    })

  });

  describe('Delete', () => {(
    it('Should be able to delete a git repo', () => {
      const fleetDashboardPage = new FleetDashboardPagePo('local');
      const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-default');

      fleetDashboardPage.goTo();
      fleetLocalResourceTable.sortableTable().deleteItemWithUI('fleet-e2e-test-gitrepo');
    })
  )}
});
