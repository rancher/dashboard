import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';
import { ChartPage } from '@/cypress/e2e/po/pages/explorer/charts/chart.po';
import { generateDeprecatedAndExperimentalCharts, generateDeprecatedAndExperimentalChart } from '@/cypress/e2e/blueprints/charts/charts';

const chartsPage = new ChartsPage();

describe('Apps/Charts', { tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
    chartsPage.goTo();
    chartsPage.waitForPage();
  });

  it('should render an informational message inside of a banner', () => {
    chartsPage.bannerContent().should('be.visible').and('not.be.empty');
  });

  it('filtering the Charts (search box) should not impact the Charts carousel', () => {
    // has the correct title (Meta tag)
    // testing https://github.com/rancher/dashboard/issues/9822
    cy.title().should('eq', 'Rancher - local - Charts');

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
      chartsPage.chartsFilterReposSelect().clickOptionWithLabelForChartReposFilter('Rancher');
      chartsPage.chartsCarouselSlides().should('have.length', length);
      chartsPage.chartsFilterReposSelect().clickOptionWithLabelForChartReposFilter('All');
      chartsPage.chartsCarouselSlides().should('have.length', length);
    });
  });

  it('Charts have expected icons', () => {
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
});
