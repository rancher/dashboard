import PagePo from '@/cypress/e2e/po/pages/page.po';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';

const burgerMenu = new BurgerMenuPo();

/**
 * About page
 */
export default class AboutPagePo extends PagePo {
  static url = '/about';
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(AboutPagePo.url);
  }

  constructor() {
    super(AboutPagePo.url);
  }

  static navTo() {
    burgerMenu.about().click();
  }

  diagnosticsBtn() {
    return cy.getId('about__diagnostics_button');
  }

  links(value: string): Cypress.Chainable {
    return this.self().get('.about').find('a').contains(value);
  }

  getLinkDestination(value: string): Cypress.Chainable {
    return this.links(value).invoke('prop', 'href');
  }

  /**
   * No longer used by about.spec.ts, which asserts the rendered link instead of following it to the
   * external site. Kept because this page object ships in the published @rancher/cypress package.
   */
  clickVersionLink(value: string) {
    this.links(value)
      .then((el) => {
        expect(el).to.have.attr('target');
      })
      .invoke('removeAttr', 'target')
      .click();
  }

  getCliDownloadLinkByLabel(label: string) {
    return this.self().contains(label);
  }

  rancherPrimeInfo() {
    return this.self().get('[data-testid="rancher-prime-about-panel"]');
  }
}
