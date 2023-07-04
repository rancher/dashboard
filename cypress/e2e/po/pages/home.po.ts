import PagePo from '@/cypress/e2e/po/pages/page.po';
import PageActions from '@/cypress/e2e/po/side-bars/page-actions.po';
import BannersPo from '~/cypress/e2e/po/components/banners.po';
import SimpleBoxPo from '~/cypress/e2e/po/components/simple-box.po';
import HomeClusterListPo from '~/cypress/e2e/po/lists/home-cluster-list.po';

const banners = new BannersPo();

export default class HomePagePo extends PagePo {
  static url = '/home'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HomePagePo.url);
  }

  static goToAndWaitForGet() {
    PagePo.goToAndWaitForGet(HomePagePo.goTo, [
      'v1/counts',
      'v1/namespaces',
      'v1/management.cattle.io.nodetemplates'
    ]);

    const homePage = new HomePagePo();

    homePage.list().checkVisible();

    return homePage;
  }

  constructor() {
    super(HomePagePo.url);
  }

  title(): Cypress.Chainable<string> {
    return cy.getId('banner-title').invoke('text');
  }

  prefPageLink(): Cypress.Chainable {
    return banners.getLoginPageBanner().find('a');
  }

  whatsNewBannerLink(): Cypress.Chainable {
    return banners.changelog().find('a');
  }

  restoreAndWait() {
    const pageActionsPo = new PageActions();

    cy.intercept('PUT', 'v1/userpreferences/*').as('restoreBanners');
    pageActionsPo.restoreLink().click();
    cy.wait(['@restoreBanners', '@restoreBanners']);
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

  supportLinks(): Cypress.Chainable {
    const simpleBox = new SimpleBoxPo();

    return simpleBox.simpleBox().find('.support-link > a');
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
