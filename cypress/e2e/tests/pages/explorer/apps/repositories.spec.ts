import ReposListPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import AppClusterRepoEditPo from '@/cypress/e2e/po/edit/catalog.cattle.io.clusterrepo.po';

describe('Apps/Repositories', { tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();

    const appRepoList = new ReposListPagePo('local', 'apps');

    appRepoList.goTo();
    appRepoList.waitForPage();
  });

  it('Should reset input values when switching from Helm index URL to Git Repo and vice versa', () => {
    const appRepoList = new ReposListPagePo('local', 'apps');

    // create a new cluster repo
    appRepoList.create();

    const appRepoCreate = new AppClusterRepoEditPo('local', 'create');

    appRepoCreate.waitForPage();

    const helmIndexUrl = 'https://charts.rancher.io';
    const gitRepoName = 'https://github.com/rancher/ui-plugin-examples';
    const gitRepoBranchName = 'test-branch';

    appRepoCreate.nameNsDescription().name().self().scrollIntoView()
      .should('be.visible');
    // fill the helm index url form
    appRepoCreate.enterHelmIndexURL(helmIndexUrl);
    // make sure the value is set
    appRepoCreate.helmIndexUrl().should('eq', helmIndexUrl);
    // select git repo option
    appRepoCreate.selectRadioOptionGitRepo(1);
    // switch back to helm index url option
    appRepoCreate.selectRadioOptionGitRepo(0);
    // test helm index value is empty
    appRepoCreate.helmIndexUrl().should('be.empty');

    // select Git repo option
    appRepoCreate.selectRadioOptionGitRepo(1);
    // fill the git repo form
    appRepoCreate.enterGitRepoName(gitRepoName);
    appRepoCreate.enterGitBranchName(gitRepoBranchName);
    // make sure the values are set
    appRepoCreate.gitRepoName().should('eq', gitRepoName);
    appRepoCreate.gitRepoBranchName().should('eq', gitRepoBranchName);
    // select helm index url option
    appRepoCreate.selectRadioOptionGitRepo(0);
    // switch back to git repo option
    appRepoCreate.selectRadioOptionGitRepo(1);
    // test git repo value is empty
    appRepoCreate.gitRepoName().should('be.empty');
    // test git repo branch value is empty
    appRepoCreate.gitRepoBranchName().should('be.empty');
  });
});
