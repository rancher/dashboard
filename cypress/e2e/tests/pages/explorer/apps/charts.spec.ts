import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';

const chartsPage = new ChartsPage();

describe('Apps/Charts', { tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('should render an informational message inside of a banner', () => {
    chartsPage.goTo();
    chartsPage.waitForPage();

    chartsPage.bannerContent().should('be.visible').and('not.be.empty');
  });

  it('filtering the Charts (search box) should not impact the Charts carousel', () => {
    chartsPage.goTo();
    chartsPage.waitForPage();

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
    chartsPage.goTo();
    chartsPage.waitForPage();

    chartsPage.checkChartGenericIcon('External IP Webhook', true);
    chartsPage.checkChartGenericIcon('Alerting Driver', false);
    chartsPage.checkChartGenericIcon('CIS Benchmark', false);
    chartsPage.checkChartGenericIcon('Logging', false);
  });
});
