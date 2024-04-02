import { ChartsPage } from '@/cypress/e2e/po/pages/charts.po';

describe('Apps/Charts', { tags: ['@explorer', '@adminUser'] }, () => {
  before(() => {
    cy.login();
  });

  it('filtering the Charts (search box) should not impact the Charts carousel', () => {
    let length = 0;
    const chartsPageUrl = '/c/local/apps/charts';
    const chartsPage = new ChartsPage(chartsPageUrl);

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
    });
  });
});
