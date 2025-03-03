import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { generateDeprecatedAndExperimentalCharts, generateDeprecatedAndExperimentalChart } from '@/cypress/e2e/blueprints/charts/charts';

const chartsPage = new ChartsPage();

describe('Apps/Charts', { tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos/**').as('fetchChartData');

    cy.login();
    chartsPage.goTo();
    chartsPage.waitForPage();
  });

  it('should render an informational message inside of a banner', () => {
    chartsPage.bannerContent().should('be.visible').and('not.be.empty');
  });

  it('filtering the Charts (search box) should not impact the Charts carousel', () => {
    chartsPage.chartsFilterCategoriesSelect().toggle();
    chartsPage.chartsFilterCategoriesSelect().clickOptionWithLabel('All Categories');
    chartsPage.chartsFilterReposSelect().toggle();
    chartsPage.chartsFilterReposSelect().enableOptionWithLabelForChartReposFilter('All');
    chartsPage.chartsFilterCategoriesSelect().checkOptionSelected('All Categories');
    chartsPage.chartsFilterReposSelect().checkOptionSelected('All');
    chartsPage.chartsFilterInput().clear();

    // testing https://github.com/rancher/dashboard/issues/10027
    chartsPage.chartsCarouselSlides().then(($val) => {
      const length = $val.length;

      // Test text filter
      chartsPage.chartsFilterInput().type('just some random text');
      chartsPage.chartsCarouselSlides().should('have.length', length);
      chartsPage.chartsFilterInput().clear();
      chartsPage.chartsCarouselSlides().should('have.length', length);

      // Test categories filter
      chartsPage.chartsFilterCategoriesSelect().toggle();
      chartsPage.chartsFilterCategoriesSelect().clickOptionWithLabel('Applications');
      chartsPage.chartsCarouselSlides().should('have.length', length);
      chartsPage.chartsFilterCategoriesSelect().toggle();
      chartsPage.chartsFilterCategoriesSelect().clickOptionWithLabel('All Categories');
      chartsPage.chartsCarouselSlides().should('have.length', length);

      // Test repo filter
      chartsPage.chartsFilterReposSelect().toggle();
      chartsPage.chartsFilterReposSelect().enableOptionWithLabelForChartReposFilter('Rancher');
      chartsPage.chartsCarouselSlides().should('have.length', length);
      chartsPage.chartsFilterReposSelect().enableOptionWithLabelForChartReposFilter('All');
      chartsPage.chartsCarouselSlides().should('have.length', length);

      // has the correct title (Meta tag)
      // testing https://github.com/rancher/dashboard/issues/9822
      cy.title().should('eq', 'Rancher - local - Charts');
    });
  });

  it('Charts have expected icons', () => {
    chartsPage.chartsFilterReposSelect().toggle();
    chartsPage.chartsFilterReposSelect().enableOptionWithLabelForChartReposFilter('All');
    chartsPage.checkChartGenericIcon('Alerting Driver', false);
    chartsPage.checkChartGenericIcon('CIS Benchmark', false);
    chartsPage.checkChartGenericIcon('Logging', false);
  });

  it('Show deprecated apps filter works properly', () => {
    generateDeprecatedAndExperimentalCharts();
    cy.wait('@generateDeprecatedAndExperimentalCharts');
    // by default "Show deprecated apps" filter is not enabled (except if "deprecated" query param exists in the url)
    chartsPage.chartsShowDeprecatedFilterCheckbox().isUnchecked();
    // a deprecated chart should not be listed before enabling the checkbox
    chartsPage.getChartByName('deprecatedChart').should('not.exist');
    // an experimental chart should still be visible
    chartsPage.getChartByName('experimentalChart').should('exist').scrollIntoView().and('be.visible');
    // a chart that's deprecated & experimental should not be listed before enabling the checkbox
    chartsPage.getChartByName('deprecatedAndExperimentalChart').should('not.exist');
    // enabling the checkbox
    chartsPage.chartsShowDeprecatedFilterCheckbox().set();
    chartsPage.getChartByName('deprecatedChart').should('exist').scrollIntoView().and('be.visible');
    chartsPage.getChartByName('experimentalChart').should('exist').scrollIntoView().and('be.visible');
    chartsPage.getChartByName('deprecatedAndExperimentalChart').should('exist').scrollIntoView().and('be.visible');
    // going to chart's page
    const chartPage = new ChartPage();

    generateDeprecatedAndExperimentalChart();
    chartsPage.getChartByName('deprecatedAndExperimentalChart').click();
    cy.wait('@generateDeprecatedAndExperimentalChart');
    // checking the "deprecated" query to be included in the url
    cy.location('search').should('include', 'deprecated=true');
    // checking the warning banner to be visible
    chartPage.deprecationAndExperimentalWarning().banner().should('exist').and('be.visible');
  });

  it('should call fetch when route query changes with valid parameters', () => {
    const chartName = 'Logging';

    cy.wait('@fetchChartData');
    cy.get('@fetchChartData.all').should('have.length.at.least', 3);

    chartsPage.getChartByName(chartName)
      .should('exist')
      .scrollIntoView()
      .should('be.visible')
      .click();

    const chartPage = new ChartPage();

    chartPage.waitForPage();

    // Set up intercept for the network request triggered by $fetch
    cy.intercept('GET', '**/v1/catalog.cattle.io.clusterrepos/**').as('fetchChartDataAfterSelect');

    chartPage.selectVersion('105.1.0+up4.10.0');

    cy.wait('@fetchChartDataAfterSelect').its('response.statusCode').should('eq', 200);
  });

  it('should not call fetch when navigating back to charts page', () => {
    const chartName = 'Logging';

    cy.wait('@fetchChartData');
    cy.get('@fetchChartData.all').should('have.length.at.least', 3);

    chartsPage.getChartByName(chartName)
      .should('exist')
      .scrollIntoView()
      .should('be.visible')
      .click();

    const chartPage = new ChartPage();

    chartPage.waitForPage();

    // Navigate back to the charts page
    cy.go('back');
    chartsPage.waitForPage();

    // Set up intercept after navigating back
    cy.intercept('GET', '**/v1/catalog.cattle.io.clusterrepos/**').as('fetchChartDataAfterBack');

    cy.get('@fetchChartDataAfterBack.all').should('have.length', 0);
  });

  it('A disabled repo should NOT be listed on the repos dropdown', () => {
    const disabledRepoId = 'disabled-repo';

    cy.intercept('GET', '/v1/catalog.cattle.io.clusterrepos?exclude=metadata.managedFields', (req) => {
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

    chartsPage.chartsFilterReposSelect().toggle();
    chartsPage.chartsFilterReposSelect().isOpened();
    chartsPage.chartsFilterReposSelect().getOptions().should('have.length', 3); // should include three options: All, enabled-repo-1 and enabled-repo-2
    chartsPage.chartsFilterReposSelect().getOptions().contains(disabledRepoId)
      .should('not.exist');
  });
});
