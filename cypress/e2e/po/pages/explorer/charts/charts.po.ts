import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import RcItemCardPo from '@/cypress/e2e/po/components/rc-item-card.po';
import RcFilterPanelPo from '@/cypress/e2e/po/components/rc-filter-panel.po';

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
    return new RcFilterPanelPo(this.self()).getFilterByName(name);
  }

  getAllOptionsByFilterGroupName(name: string) {
    return new RcFilterPanelPo(this.self()).getOptionsByFilterGroupName(name);
  }

  resetAllFilters() {
    const filterPanel = new RcFilterPanelPo(this.self());

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
    const src = RcItemCardPo.getCardByTitle(name).getImage().invoke('attr', 'src');

    if (isGeneric) {
      return src.should('contain', 'generic-catalog');
    }

    return src.should('not.contain', 'generic-catalog');
  }

  bannerContent() {
    return new BannersPo('[data-testid="banner-content"]', this.self()).bannerElement('span');
  }
}
