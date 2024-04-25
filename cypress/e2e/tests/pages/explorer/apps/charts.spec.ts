import { ChartsPage } from '@/cypress/e2e/po/pages/explorer/charts/charts.po';

describe('Apps/Charts', { tags: ['@explorer', '@adminUser'] }, () => {
  beforeEach(() => {
    cy.login();
  });

  it('should render an informational message inside of a banner', () => {
    const chartsPage = new ChartsPage();

    chartsPage.goTo();
    chartsPage.waitForPage();

    chartsPage.bannerContent().should('be.visible').and('not.be.empty');
  });

  it('filtering the Charts (search box) should not impact the Charts carousel', () => {
    let length = 0;
    const chartsPage = new ChartsPage();

    chartsPage.goTo();
    chartsPage.waitForPage();

    // has the correct title (Meta tag)
    // testing https://github.com/rancher/dashboard/issues/9822
    cy.title().should('eq', 'Rancher - local - Charts');

    // testing https://github.com/rancher/dashboard/issues/10027
    chartsPage.chartsCarouselSlides().then(($val) => {
      length = $val.length;

      chartsPage.chartsFilterInput().type('just some random text');

      chartsPage.chartsCarouselSlides().should('have.length', length);

      // reset text filter input
      chartsPage.chartsFilterInput().clear();

      chartsPage.chartsFilterCategoriesSelect().toggle();
      chartsPage.chartsFilterCategoriesSelect().clickOptionWithLabel('Applications');

      chartsPage.chartsCarouselSlides().should('have.length', length);

      // reset categories filter
      chartsPage.chartsFilterCategoriesSelect().toggle();
      chartsPage.chartsFilterCategoriesSelect().clickOptionWithLabel('All Categories');

      chartsPage.chartsFilterReposSelect().toggle();
      chartsPage.chartsFilterReposSelect().getOptions();
      chartsPage.chartsFilterReposSelect().clickOptionWithLabelForChartReposFilter('Rancher');

      chartsPage.chartsCarouselSlides().should('have.length', length);
    });
  });
});
