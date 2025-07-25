import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';
import ReposListPagePo from '@/cypress/e2e/po/pages/chart-repositories.po';

const chartsPage = new ChartsPage();

describe('Apps/Charts', { tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', `${ CLUSTER_REPOS_BASE_URL }/**`).as('fetchChartData');

    cy.login();
    chartsPage.goTo();
    chartsPage.waitForPage();
  });

  it('Charts have expected icons', () => {
    chartsPage.resetAllFilters();
    chartsPage.checkChartGenericIcon('Alerting Driver', false);
    chartsPage.checkChartGenericIcon('CIS Benchmark', false);
    chartsPage.checkChartGenericIcon('Logging', false);
  });

  it('should call fetch when route query changes with valid parameters', () => {
    const chartName = 'Logging';

    cy.wait('@fetchChartData');
    cy.get('@fetchChartData.all').should('have.length.at.least', 3);

    chartsPage.getChartByName(chartName)
      .checkExists()
      .scrollIntoView()
      .should('be.visible')
      .click();

    const chartPage = new ChartPage();

    chartPage.waitForPage();

    // Set up intercept for the network request triggered by $fetch
    cy.intercept('GET', `**${ CLUSTER_REPOS_BASE_URL }/**`).as('fetchChartDataAfterSelect');

    chartPage.selectVersion('105.1.0+up4.10.0');

    cy.wait('@fetchChartDataAfterSelect').its('response.statusCode').should('eq', 200);
  });

  it('should not call fetch when navigating back to charts page', () => {
    const chartName = 'Logging';

    cy.wait('@fetchChartData');
    cy.get('@fetchChartData.all').should('have.length.at.least', 3);

    chartsPage.getChartByName(chartName)
      .checkExists()
      .scrollIntoView()
      .should('be.visible')
      .click();

    const chartPage = new ChartPage();

    chartPage.waitForPage();

    // Navigate back to the charts page
    cy.go('back');
    chartsPage.waitForPage();

    // Set up intercept after navigating back
    cy.intercept('GET', `**${ CLUSTER_REPOS_BASE_URL }/**`).as('fetchChartDataAfterBack');

    cy.get('@fetchChartDataAfterBack.all').should('have.length', 0);
  });

  it('A disabled repo should NOT be listed on the list of repository filters', () => {
    // go to repository page and disable a repo
    const appRepoList = new ReposListPagePo('local', 'apps');

    appRepoList.goTo();
    appRepoList.waitForGoTo(`${ CLUSTER_REPOS_BASE_URL }?exclude=metadata.managedFields`);
    appRepoList.sortableTable().checkLoadingIndicatorNotVisible();
    appRepoList.list().actionMenu('Partners').getMenuItem('Disable').click();
    // go to charts page
    chartsPage.goTo();
    chartsPage.waitForPage();
    // check enabled repos are listed but the disabled repo is not
    chartsPage.getFilterOptionByName('Rancher').checkExists();
    chartsPage.getFilterOptionByName('RKE2').checkExists();
    chartsPage.getAllOptionsByGroupName('Repository').contains('Partners')
      .should('not.exist');

    // re-enable the disabled repo
    appRepoList.goTo();
    appRepoList.waitForGoTo(`${ CLUSTER_REPOS_BASE_URL }?exclude=metadata.managedFields`);
    appRepoList.sortableTable().checkLoadingIndicatorNotVisible();
    appRepoList.list().actionMenu('Partners').getMenuItem('Enable').click();
  });
});
