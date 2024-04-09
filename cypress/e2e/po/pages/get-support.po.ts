import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import SimpleBoxPo from '@/cypress/e2e/po/components/simple-box.po';

const burgerMenu = new BurgerMenuPo();

/**
 * Get Support page
 */
export default class SupportPagePo extends PagePo {
  static url = '/support'
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(SupportPagePo.url);
  }

  constructor() {
    super(SupportPagePo.url);
  }

  static navTo() {
    BurgerMenuPo.toggle();
    burgerMenu.support().click();
  }

  supportLinks(): Cypress.Chainable {
    const simpleBox = new SimpleBoxPo();

    return simpleBox.simpleBox().find('.support-link > a').should('be.visible');
  }

  externalSupportLinks(index: number): Cypress.Chainable {
    return this.self().get('.external .support-link > a').eq(index);
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

  clickExternalSupportLinks(index: number) {
    return this.externalSupportLinks(index).then((el) => {
      expect(el).to.have.attr('target');
    })
      .invoke('removeAttr', 'target')
      .click();
  }
}
