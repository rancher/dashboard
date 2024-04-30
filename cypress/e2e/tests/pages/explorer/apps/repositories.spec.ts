import ReposListPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import AppClusterRepoEditPo from '@/cypress/e2e/po/edit/catalog.cattle.io.clusterrepo.po';

describe('Apps/Repositories', { tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();

    const appRepoList = new ReposListPagePo('local', 'apps');

    appRepoList.goTo();
    appRepoList.waitForPage();
  });

  it('Should reset input values when switching cluster repo type', () => {
    const appRepoList = new ReposListPagePo('local', 'apps');

    // create a new cluster repo
    appRepoList.create();

    const appRepoCreate = new AppClusterRepoEditPo('local', 'create');

    appRepoCreate.waitForPage();

    const helmIndexUrl = 'https://charts.rancher.io';
    const ociValues = {
      url:        'oci://test.rancher.io/charts/mychart',
      caBundle:   'test',
      minWait:    '2',
      maxWait:    '2',
      maxRetries: '2'
    };
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

    // select oci option
    appRepoCreate.selectRadioOptionGitRepo(2);
    // fill the oci form
    appRepoCreate.enterOciURL(ociValues.url);
    appRepoCreate.enterOciCaBundle(ociValues.caBundle);
    appRepoCreate.ociSkipTlsCheckbox().set();
    appRepoCreate.ociInsecurePlainHttpCheckbox().set();
    appRepoCreate.enterOciMinWait(ociValues.minWait);
    appRepoCreate.enterOciMaxWait(ociValues.maxWait);
    appRepoCreate.enterOciMaxRetries(ociValues.maxRetries);
    // make sure the values are set
    appRepoCreate.ociUrl().should('eq', ociValues.url);
    appRepoCreate.ociCaBundle().should('eq', ociValues.caBundle);
    appRepoCreate.ociSkipTlsCheckbox().isChecked();
    appRepoCreate.ociInsecurePlainHttpCheckbox().isChecked();
    appRepoCreate.ociMinWait().should('eq', ociValues.minWait);
    appRepoCreate.ociMaxWait().should('eq', ociValues.maxWait);
    appRepoCreate.ociMaxRetries().should('eq', ociValues.maxRetries);
    // select helm index url option
    appRepoCreate.selectRadioOptionGitRepo(0);
    // switch back to oci option
    appRepoCreate.selectRadioOptionGitRepo(2);
    // test oci values to be empty
    appRepoCreate.ociUrl().should('be.empty');
    appRepoCreate.ociCaBundle().should('be.empty');
    appRepoCreate.ociSkipTlsCheckbox().isUnchecked();
    appRepoCreate.ociInsecurePlainHttpCheckbox().isUnchecked();
    appRepoCreate.ociMinWait().should('be.empty');
    appRepoCreate.ociMaxWait().should('be.empty');
    appRepoCreate.ociMaxRetries().should('be.empty');
    // check auth dropdown not to have SSH key option when oci is selected
    appRepoCreate.authSelectOrCreate().authSelect().toggle();
    appRepoCreate.authSelectOrCreate().authSelect().getOptions().contains('Create a HTTP Basic Auth Secret')
      .should('exist');
    appRepoCreate.authSelectOrCreate().authSelect().getOptions().contains('Create a SSH Key Secret')
      .should('not.exist');
  });
});
