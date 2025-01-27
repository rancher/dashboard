//
import ReposListPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import AppClusterRepoEditPo from '@/cypress/e2e/po/edit/catalog.cattle.io.clusterrepo.po';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';

describe('Apps', () => {
  describe('Repositories', { tags: ['@explorer', '@adminUser'] }, () => {
    describe('Add', () => {
      const appRepoList = new ReposListPagePo('local', 'apps');

      beforeEach(() => {
        cy.login();

        appRepoList.goTo();
        appRepoList.waitForGoTo('/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields');

        cy.createE2EResourceName('helm-repo-dupe-test').as('helmRepoDupeName');
      });

      describe('Contained', () => {
        const reposToDelete = [];

        it('After add Repo list should not contain multiple entries', function() {
          const appRepoCreate = new AppClusterRepoEditPo('local', 'create');

          appRepoList.sortableTable().checkLoadingIndicatorNotVisible();

          appRepoList.sortableTable().rowCount().should('be.lessThan', 10); // catch page size 10...
          // Check that the table has settled and rendered all rows
          // This is a bit hacky, but assume table settled when we have all of these three rows
          appRepoList.sortableTable().rowElementWithName('Partners').should('be.visible');
          appRepoList.sortableTable().rowElementWithName('Rancher').should('be.visible');
          appRepoList.sortableTable().rowElementWithName('RKE2').should('be.visible');
          // Table settled. Get row count
          appRepoList.sortableTable().rowCount().then((count) => {
            // track repo rows

            const initialRowCount = count;

            // create a new cluster repo
            appRepoList.create();
            appRepoCreate.waitForPage();
            appRepoCreate.nameNsDescription().name().self().scrollIntoView()
              .should('be.visible');
            appRepoCreate.nameNsDescription().name().set(this.helmRepoDupeName);
            appRepoCreate.create().self().scrollIntoView();
            appRepoCreate.create().click();

            // test repo rows
            appRepoList.waitForPage();
            reposToDelete.push(this.helmRepoDupeName);
            appRepoList.sortableTable().rowCount().should('eq', initialRowCount + 1);
          });
        });

        // Ensure this runs after an attempt, rather than all attemps (`after` only runs once after all cypress retries)
        afterEach(() => {
          for (const repo of reposToDelete) {
            cy.deleteRancherResource('v1', 'catalog.cattle.io.clusterrepos', repo, false).then((res: Cypress.Response<any>) => {
              if (res.status === 201) {
                reposToDelete.splice(reposToDelete.indexOf(repo), 1);
              }
            });
          }
        });
      });

      it('Should reset input values when switching cluster repo type', () => {
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
        appRepoCreate.authSelectOrCreate().authSelect().getOptions().contains('Create an HTTP Basic Auth Secret')
          .should('exist');
        appRepoCreate.authSelectOrCreate().authSelect().getOptions().contains('Create an SSH Key Secret')
          .should('not.exist');
      });
    });

    describe('Refresh', () => {
      const chartPage = new ChartPage();
      const clusterId = 'local';
      const appRepoList = new ReposListPagePo(clusterId, 'apps');
      const chartsPage = new ChartsPage(clusterId);

      beforeEach(() => {
        cy.login();

        appRepoList.goTo();
        appRepoList.waitForPage();
      });

      it('Repo Refresh results in correct api requests', () => {
        // Root request to the Rancher helm chart repo
        cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos/rancher-charts?*').as('rancherCharts1');

        // Nav to a summary page for a specific chart
        chartsPage.goTo();
        chartsPage.chartsFilterCategoriesSelect().toggle();
        chartsPage.chartsFilterCategoriesSelect().clickOptionWithLabel('All Categories');
        chartsPage.chartsFilterReposSelect().toggle();
        chartsPage.chartsFilterReposSelect().enableOptionWithLabelForChartReposFilter('All');
        chartsPage.chartsFilterCategoriesSelect().checkOptionSelected('All Categories');
        chartsPage.chartsFilterReposSelect().checkOptionSelected('All');
        chartsPage.chartsFilterInput().clear();

        chartsPage.charts().select('Rancher Backups');
        chartPage.waitForPage();

        // The repo charts should have been fetched
        cy.wait('@rancherCharts1').its('request.url').should('include', 'link=index');
        // The specific version of the chart should be fetched
        cy.wait('@rancherCharts1').its('request.url').should('include', 'version=');

        // Nav to any other page
        ReposListPagePo.navTo(clusterId, 'apps');
        appRepoList.waitForPage();

        // Nav back to the summary page for a specific chart
        // Note we're intercepting a more precise url here to avoid any icon requests made from the charts list
        cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos/rancher-charts?link=info&chartName=rancher-backup&version=*', cy.spy().as('rancherCharts2'));
        ChartPage.navTo(clusterId, 'Rancher Backups');
        chartPage.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-backup');
        // The specific version of the chart (and any other) should NOT be fetched
        cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
        cy.get('@rancherCharts2').should('not.have.been.called');

        // Nav to the helm chart repo page
        ReposListPagePo.navTo(clusterId, 'apps');
        appRepoList.waitForPage();

        // Refresh the Rancher repo (clears caches)
        cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos/rancher-charts?*').as('rancherCharts3');
        appRepoList.list().refreshRepo('Rancher');
        // The charts should immediately update
        cy.wait('@rancherCharts3').its('request.url').should('include', '?link=index');

        // Nav to the summary page for a specific chart
        ChartPage.navTo(clusterId, 'Rancher Backups');
        chartPage.waitForPage('repo-type=cluster&repo=rancher-charts&chart=rancher-backup');
        // The specific version of the chart should be fetched (as the cache was cleared)
        cy.wait('@rancherCharts3').its('request.url').should('include', 'version=');
      });
    });
  });
});
