import PagePo from '@/cypress/e2e/po/pages/page.po';
import SelectPo from '@/cypress/e2e/po/components/select.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

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

    BurgerMenuPo.toggle();
    burgerMenu.clusters().contains(clusterId).click();
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

  selectChart(name: string) {
    cy.get('.grid .name').contains(name).click();
  }

  bannerContent() {
    return new BannersPo('[data-testid="banner-content"]', this.self()).bannerElement('span');
  }
}
