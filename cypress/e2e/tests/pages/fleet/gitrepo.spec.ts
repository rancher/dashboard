import { GitRepoCreatePo } from '@/cypress/e2e/po/pages/fleet/gitrepo-create.po';
import { FleetDashboardPagePo } from '@/cypress/e2e/po/pages/fleet/fleet-dashboard.po';

describe('Git Repo', { tags: '@adminUser' }, () => {
  beforeEach(() => {
    cy.login();
  });

  describe('Create', () => {
    let gitRepoCreatePage: GitRepoCreatePo;
    const repoList = [];

    beforeEach(() => {
      gitRepoCreatePage = new GitRepoCreatePo('local');
    });

    it('Should be able to create a git repo', () => {
      gitRepoCreatePage.goTo();
      gitRepoCreatePage.setRepoName('fleet-e2e-test-gitrepo');
      gitRepoCreatePage.setGitRepoUrl('https://github.com/rancher/fleet-test-data.git');
      gitRepoCreatePage.setBranchName();
      gitRepoCreatePage.gitRepoPaths().setValueAtIndex('simple', 0);
      gitRepoCreatePage.goToNext();
      gitRepoCreatePage.create();

      repoList.push('fleet-e2e-test-gitrepo');
    });

    after(() => {
      const fleetDashboardPage = new FleetDashboardPagePo('local');

      fleetDashboardPage.goTo();
      const fleetLocalResourceTable = fleetDashboardPage.resourceTable('fleet-default');

      fleetLocalResourceTable.sortableTable().deleteItemWithUI('fleet-e2e-test-gitrepo');
    });
  });
});
