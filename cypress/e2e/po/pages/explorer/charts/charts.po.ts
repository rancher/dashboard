import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import RcItemCardPo from '@/cypress/e2e/po/components/rc-item-card.po';
import FilterPanelPo from '@/cypress/e2e/po/components/filter-panel.po';

export class ChartsPage extends PagePo {
  private static createPath(clusterId: string) {
    return `/c/${ clusterId }/apps/charts`;
  }

  static goTo(clusterId: string): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(ChartsPage.createPath(clusterId));
  }

  constructor(clusterId = 'local') {
    super(ChartsPage.createPath(clusterId));
  }

  static navTo(clusterId = 'local') {
    const burgerMenu = new BurgerMenuPo();
    const sideNav = new ProductNavPo();

    burgerMenu.goToCluster(clusterId);
    sideNav.navToSideMenuGroupByLabel('Apps');
  }

  chartsSearchFilterInput() {
    return this.self().find('[data-testid="charts-filter-input"]');
  }

  getFilterOptionByName(name: string) {
    return new FilterPanelPo(this.self()).getFilterByName(name);
  }

  getAllOptionsByGroupName(name: string) {
    return new FilterPanelPo(this.self()).getFiltersByGroupName(name);
  }

  resetAllFilters() {
    const filterPanel = new FilterPanelPo(this.self());

    filterPanel.assertAllCheckboxesUnchecked();
    this.chartsSearchFilterInput().clear();
  }

  getChartByName(name: string): RcItemCardPo {
    return RcItemCardPo.getCardByTitle(name);
  }

  clickChart(name: string) {
    return RcItemCardPo.getCardByTitle(name).click();
  }

  checkChartGenericIcon(name: string, isGeneric = true) {
    this.chartsSearchFilterInput().type(name);
    cy.location().should((loc) => {
      const params = new URLSearchParams(loc.search);

      expect(params.get('q')).to.eq(name);
    });
    this.chartCards().should('have.length.at.least', 1);

    const src = RcItemCardPo.getCardByTitle(name).getImage().invoke('attr', 'src');

    if (isGeneric) {
      src.should('contain', 'generic-catalog');
    } else {
      src.should('not.contain', 'generic-catalog');
    }

    this.chartsSearchFilterInput().clear();
    cy.location().should((loc) => {
      const params = new URLSearchParams(loc.search);

      expect(params.get('q')).to.equal(null);
    });
  }

  emptyState() {
    return this.self().find('[data-testid="charts-empty-state"]');
  }

  emptyStateTitle() {
    return this.self().find('[data-testid="charts-empty-state-title"]').invoke('text');
  }

  emptyStateResetFilters() {
    return this.self().find('[data-testid="charts-empty-state-reset-filters"]');
  }

  totalChartsCount() {
    return this.self().find('[data-testid="charts-total-message"]').invoke('text').then((text) => parseInt(text.match(/\d+/)[0], 10));
  }

  chartCards() {
    return this.self().find('[data-testid="app-chart-cards-container"] > [data-testid*="item-card-"]');
  }

  scrollContainer() {
    return cy.get('.main-layout');
  }

  sentinel() {
    return this.self().find('[data-testid="charts-lazy-load-sentinel"]');
  }
}
