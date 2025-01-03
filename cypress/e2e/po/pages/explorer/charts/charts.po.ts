import PagePo from '@/cypress/e2e/po/pages/page.po';
import SelectPo from '@/cypress/e2e/po/components/select.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import SelectIconGridPo from '@/cypress/e2e/po/components/select-icon-grid.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';

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

  chartsCarousel() {
    return this.self().find('[data-testid="charts-carousel"]');
  }

  chartsCarouselSlides() {
    return this.chartsCarousel().get('[id="slide-track"] > div');
  }

  chartsFilterInput() {
    return this.self().find('[data-testid="charts-filter-input"]');
  }

  chartsFilterCategoriesSelect() {
    return new SelectPo(this.self().find('[data-testid="charts-filter-category"]'));
  }

  chartsFilterReposSelect() {
    return new SelectPo(this.self().find('[data-testid="charts-filter-repos"]'));
  }

  chartsShowDeprecatedFilterCheckbox() {
    return new CheckboxInputPo(this.self().find('[data-testid="charts-show-deprecated-filter"]'));
  }

  charts() {
    return new SelectIconGridPo('[data-testid="chart-selection-grid"]', 'chart-selection');
  }

  getChartByName(name: string) {
    return this.charts().self().find(`[data-testid="select-icon-grid-${ name }"]`);
  }

  checkChartGenericIcon(name: string, isGeneric = true) {
    const src = this.charts().self().contains(name).parent()
      .find('.logo img')
      .invoke('attr', 'src');

    if (isGeneric) {
      return src.should('contain', 'generic-catalog');
    }

    return src.should('not.contain', 'generic-catalog');
  }

  bannerContent() {
    return new BannersPo('[data-testid="banner-content"]', this.self()).bannerElement('span');
  }
}
