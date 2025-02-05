import PagePo from '@/cypress/e2e/po/pages/page.po';
import PageActions from '@/cypress/e2e/po/side-bars/page-actions.po';
import BannerGraphicPo from '@/cypress/e2e/po/components/banner-graphic.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';
import SimpleBoxPo from '@/cypress/e2e/po/components/simple-box.po';
import HomeClusterListPo from '@/cypress/e2e/po/lists/home-cluster-list.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

const burgerMenu = new BurgerMenuPo();

export default class HomePagePo extends PagePo {
  static url = '/home'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HomePagePo.url);
  }

  static goToAndWaitForGet() {
    // There's a lot of tests that start off on the home page
    // There's issues reporting when this page is ready, specifically for the user avatar click
    // To help with this be super sure the page is ready

    PagePo.goToAndWaitForGet(HomePagePo.goTo, [
      'v1/counts?exclude=metadata.managedFields',
      'v1/namespaces?exclude=metadata.managedFields',
    ]);

    const homePage = new HomePagePo();

    homePage.list().checkVisible();
    homePage.bannerGraphic().checkVisible();

    return homePage;
  }

  constructor() {
    super(HomePagePo.url);
  }

  static navTo() {
    BurgerMenuPo.toggle();
    burgerMenu.home().click();
  }

  title(): Cypress.Chainable<string> {
    return cy.getId('banner-title').invoke('text');
  }

  prefPageLink(): Cypress.Chainable {
    return this.getLoginPageBanner().self().find('a');
  }

  whatsNewBannerLink(): Cypress.Chainable {
    return this.changelog().self().find('a');
  }

  restoreAndWait() {
    const pageActionsPo = new PageActions();

    cy.intercept('PUT', 'v1/userpreferences/*').as('restoreBanners');
    pageActionsPo.restoreLink().click();
    cy.wait(['@restoreBanners', '@restoreBanners']);
  }

  toggleBanner() {
    const pageActionsPo = new PageActions();

    cy.intercept('PUT', 'v1/userpreferences/*').as('toggleBanner');
    pageActionsPo.toggleBanner().click();
    cy.wait('@toggleBanner');
  }

  list(): HomeClusterListPo {
    return new HomeClusterListPo('[data-testid="sortable-table-list-container"]');
  }

  manageButton() {
    return cy.getId('cluster-management-manage-button');
  }

  importExistingButton() {
    return cy.getId('cluster-create-import-button');
  }

  createButton() {
    return cy.getId('cluster-create-button');
  }

  supportLinks(): Cypress.Chainable {
    const simpleBox = new SimpleBoxPo();

    return simpleBox.simpleBox().find('.support-link > a').should('be.visible');
  }

  bannerGraphic() {
    return new BannerGraphicPo();
  }

  /**
   * Get change log banner
   * @returns
   */
  changelog() {
    return new BannersPo(cy.getId('changelog-banner'));
  }

  /**
   * Get set login page banner
   * @returns
   */
  getLoginPageBanner() {
    return new BannersPo(cy.getId('set-login-page-banner'));
  }

  /**
    * Get the home page banner image
   * @returns
   */
  getBrandBannerImage(): Cypress.Chainable {
    return cy.getId('banner-brand__img');
  }

  /**
   * Click support link
   * Cypress does not support multiple tabs - must remove target attribute before clicking
   * https://docs.cypress.io/guides/references/trade-offs#Multiple-tabs
   * @param index
   * @param isNewTab
   * @returns
   */
  clickSupportLink(index: number, isNewTab?: boolean) {
    if (isNewTab) {
      this.supportLinks().eq(index).then((el) => {
        expect(el).to.have.attr('target');
      }).invoke('removeAttr', 'target')
        .click();
    } else {
      return this.supportLinks().eq(index).then((el) => {
        expect(el).to.not.have.attr('target');
      }).click();
    }
  }

  checkSupportLinkText(index: number, text: string) {
    return this.supportLinks().eq(index).then((el) => {
      expect(el.text().trim()).to.equal(text);
    });
  }
}
