import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { CLUSTER_REPOS_BASE_URL } from '@/cypress/support/utils/api-endpoints';

const chartsPage = new ChartsPage();

describe('Apps/Charts', { tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', `${ CLUSTER_REPOS_BASE_URL }/**`).as('fetchChartData');

    cy.login();
    chartsPage.goTo();
    chartsPage.waitForPage();
  });

  it('should render an informational message inside of a banner', () => {
    chartsPage.bannerContent().should('be.visible').and('not.be.empty');
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

  it('A disabled repo should NOT be listed on the repos dropdown', () => {
    const disabledRepoId = 'disabled-repo';

    cy.intercept('GET', `${ CLUSTER_REPOS_BASE_URL }?exclude=metadata.managedFields`, (req) => {
      req.reply({
        statusCode: 200,
        body:       {
          data: [
            { id: disabledRepoId, spec: { enabled: false } }, // disabled
            { id: 'enabled-repo-1', spec: { enabled: true } }, // enabled
            { id: 'enabled-repo-2', spec: {} } // enabled
          ]
        }
      });
    }).as('getRepos');

    cy.wait('@getRepos');

    chartsPage.getFilterOptionByName('enabled-repo-1').checkExists();
    chartsPage.getFilterOptionByName('enabled-repo-2').checkExists();
    chartsPage.getAllOptionsByFilterGroupName('Repository').contains(disabledRepoId)
      .should('not.exist');
  });
});
