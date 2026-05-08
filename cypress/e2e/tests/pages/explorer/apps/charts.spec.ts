import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import ReposListPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';
import { MEDIUM_TIMEOUT_OPT } from '@/cypress/support/utils/timeouts';
import { runTestWhenChartAvailable } from '@/cypress/support/commands/rancher-api-commands';
import HomePagePo from '@/cypress/e2e/po/pages/home.po';

const chartsPage = new ChartsPage();
const chartPage = new ChartPage();

describe('Apps/Charts', { tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', `${ CLUSTER_REPOS_BASE_URL }/**`).as('fetchChartData');

    cy.login();
    cy.setUserPreference({ 'show-pre-release': true }, true); // Show pre-release versions so charts with only -rc versions appear on Charts page
    chartsPage.goTo();
    chartsPage.waitForPage();
  });

  it('Charts have expected icons', function() {
    runTestWhenChartAvailable('rancher-charts', 'rancher-alerting-drivers', this, () => {
      chartsPage.resetAllFilters();
      chartsPage.checkChartGenericIcon('Alerting Driver', false);
      chartsPage.checkChartGenericIcon('Rancher Compliance', false);
      chartsPage.checkChartGenericIcon('Logging', false);
    });
  });

  it('should call fetch when route query changes with valid parameters', function() {
    runTestWhenChartAvailable('rancher-charts', 'rancher-logging', this, () => {
      const chartName = 'Logging';

      cy.wait('@fetchChartData', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
      cy.get('@fetchChartData.all').should('have.length.at.least', 3);

      ChartPage.navTo(null, chartName);
      chartPage.waitForChartHeader(chartName);

      // Set up intercept for the network request triggered by $fetch
      cy.intercept('GET', `**${ CLUSTER_REPOS_BASE_URL }/**`).as('fetchChartDataAfterSelect');

      // Select the first active version link when there is more than one version
      chartPage.versions().its('length').then((length) => {
        if (length > 1) {
          chartPage.versionLinks()
            .first()
            .then((firstVersion) => {
              chartPage.selectVersion(firstVersion.text());

              cy.wait('@fetchChartDataAfterSelect').its('response.statusCode').should('eq', 200);
            });
        }
      });
    });
  });

  it('should not call fetch when navigating back to charts page', function() {
    runTestWhenChartAvailable('rancher-charts', 'rancher-logging', this, () => {
      const chartName = 'Logging';

      cy.wait('@fetchChartData', MEDIUM_TIMEOUT_OPT).its('response.statusCode').should('eq', 200);
      cy.get('@fetchChartData.all').should('have.length.at.least', 3);

      ChartPage.navTo(null, chartName);
      chartPage.waitForChartHeader(chartName);

      // Navigate back to the charts page
      cy.go('back');
      chartsPage.waitForPage();

      // Set up intercept after navigating back
      cy.intercept('GET', `**${ CLUSTER_REPOS_BASE_URL }/**`).as('fetchChartDataAfterBack');

      cy.get('@fetchChartDataAfterBack.all').should('have.length', 0);
    });
  });

  it('A disabled repo should NOT be listed on the list of repository filters', () => {
    const CHART = {
      name: 'Partners',
      id:   'rancher-partner-charts',
    };

    // go to repository page and disable a repo
    const appRepoList = new ReposListPagePo('local', 'apps');

    appRepoList.goTo();
    appRepoList.waitForGoTo(`${ CLUSTER_REPOS_BASE_URL }?*`);
    appRepoList.sortableTable().checkLoadingIndicatorNotVisible();
    appRepoList.list().actionMenu('Partners').getMenuItem('Disable').click();
    // go to charts page
    chartsPage.goTo();
    chartsPage.waitForPage();
    // check enabled repos are listed but the disabled repo is not
    chartsPage.getFilterOptionByName('Rancher').checkExists();
    chartsPage.getFilterOptionByName('RKE2').checkExists();
    chartsPage.getAllOptionsByGroupName('Repository').contains(CHART.name)
      .should('not.exist');

    // re-enable the disabled repo
    appRepoList.goTo();
    appRepoList.waitForGoTo(`${ CLUSTER_REPOS_BASE_URL }?*`);
    appRepoList.sortableTable().checkLoadingIndicatorNotVisible();
    appRepoList.list().actionMenu('Partners').getMenuItem('Enable').click();
    cy.waitForRepositoryDownload('v1', 'catalog.cattle.io.clusterrepos', CHART.id);
    cy.waitForResourceState('v1', 'catalog.cattle.io.clusterrepos', CHART.id);
    appRepoList.list().state(CHART.name).should('contain', 'Active');
  });

  it('should display empty state properly', () => {
    // selecting Rancher repo, PaaS category and Installed status filters to get no results in order to see an empty state
    chartsPage.getFilterOptionByName('Rancher').set();
    chartsPage.getFilterOptionByName('PaaS').set();
    chartsPage.getFilterOptionByName('Installed').set();
    // check empty state to be displayed
    chartsPage.emptyState().should('be.visible');
    chartsPage.emptyStateTitle().should('eq', 'No charts to show');
    // reset filters
    chartsPage.emptyStateResetFilters().should('be.visible');
    chartsPage.emptyStateResetFilters().click();
    // check empty state is NOT displayed
    chartsPage.emptyState().should('not.exist');
  });

  after(() => {
    cy.setUserPreference({ 'show-pre-release': false });
  });
});

describe('Chart Details Page', { tags: ['@explorer', '@adminUser'] }, () => {
  const chartName = 'Logging';

  beforeEach(() => {
    cy.intercept('GET', `${ CLUSTER_REPOS_BASE_URL }/**`).as('fetchChartData');

    cy.login();
    cy.setUserPreference({ 'show-pre-release': true }, true); // Show pre-release versions
    HomePagePo.goTo();
  });

  it('should navigate to the correct repository page', function() {
    runTestWhenChartAvailable('rancher-charts', 'rancher-logging', this, () => {
      ChartPage.navTo(null, chartName);
      chartPage.waitForChartHeader(chartName);

      chartPage.repoLink().click();
      cy.url().should('include', '/c/local/apps/catalog.cattle.io.clusterrepo/rancher-charts');
    });
  });

  it('should navigate to the charts list with the correct filters when a keyword is clicked', function() {
    runTestWhenChartAvailable('rancher-charts', 'rancher-logging', this, () => {
      ChartPage.navTo(null, chartName);
      chartPage.waitForChartHeader(chartName);

      chartPage.keywords().first().click();
      chartsPage.waitForPage();
      cy.url().should('include', 'q=logging');
    });
  });

  it('should show more versions when the button is clicked (when there are more than 7 versions)', function() {
    runTestWhenChartAvailable('rancher-charts', 'rancher-logging', this, () => {
      ChartPage.navTo(null, chartName);
      chartPage.waitForChartHeader(chartName);

      cy.getRancherResource('v1', 'catalog.cattle.io.clusterrepos', 'rancher-charts?link=index').then((res: any) => {
        const entries = res.body.entries;
        const rancherLoggingVersions = entries['rancher-logging'];
        const totalCount = rancherLoggingVersions.length;

        if (totalCount > 7) {
          chartPage.versions().should('have.length', 7);
          chartPage.showMoreVersions().should('be.visible').click();
          chartPage.versions().should('have.length', totalCount);
        } else {
          chartPage.versions().should('have.length', totalCount);
          chartPage.showMoreVersions().should('not.exist');
        }
      });
    });
  });

  after(() => { // Reset user preference
    cy.setUserPreference({ 'show-pre-release': false });
  });
});
