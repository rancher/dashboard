import PagePo from '@/cypress/e2e/po/pages/page.po';
import PageActions from '@/cypress/e2e/po/side-bars/page-actions.po';
import HomeClusterListPo from '~/cypress/e2e/po/lists/home-cluster-list.po';

export default class HomePagePo extends PagePo {
  static url = '/home'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HomePagePo.url);
  }

  static goToAndWaitForGet() {
    PagePo.goToAndWaitForGet(HomePagePo.goTo, [
      'v1/counts',
      'v1/namespaces',
    ]);
  }

  constructor() {
    super(HomePagePo.url);
  }

  title(): Cypress.Chainable<string> {
    return cy.getId('banner-title').invoke('text');
  }

  graphicBanner(): Cypress.Chainable {
    return cy.getId('home-banner-graphic');
  }

  graphicBannerCloseButton(): Cypress.Chainable {
    return cy.getId('graphic-banner-close').click({ force: true });
  }

  setLoginPageBanner(): Cypress.Chainable {
    return cy.getId('set-login-page-banner');
  }

  closeButton(): Cypress.Chainable {
    return cy.getId('banner-close').click({ force: true });
  }

  banner(): Cypress.Chainable {
    return cy.getId('banner-content');
  }

  prefPageLink(): Cypress.Chainable {
    return cy.getId('pref-banner-link');
  }

  changelog(): Cypress.Chainable {
    return cy.getId('changelog-banner');
  }

  whatsNewBannerLink(): Cypress.Chainable {
    return cy.get('[data-testid="changelog-banner"] a');
  }

  waitForRestore() {
    const pageActionsPo = new PageActions();

    cy.intercept('PUT', 'v1/userpreferences/*', (req) => {
      if (req?.body?.data?.['home-page-cards'] === '{}') {
        req.alias = 'restoreBanners';
      }
    });
    pageActionsPo.restoreLink().click();
    cy.wait('@restoreBanners');
  }

  list(): HomeClusterListPo {
    return new HomeClusterListPo('[data-testid="cluster-list-container"]');
  }

  manangeButton() {
    return cy.getId('cluster-management-manage-button');
  }

  importExistingButton() {
    return cy.getId('cluster-create-import-button');
  }

  createButton() {
    return cy.getId('cluster-create-button');
  }

  filter(searchText: string) {
    return cy.get('[data-testid="search-box-filter-row"] input')
      .focus()
      .clear()
      .type(searchText);
  }

  supportLinks() {
    return cy.getId('simple-box-container').find('.support-link > a');
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
}
