import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import ModalWithCardPo from '@/cypress/e2e/po/components/modal-with-card.po';
import RootClusterPage from '@/cypress/e2e/po/pages/root-cluster-page';
import BurgerMenuPo from '@/cypress/e2e/po/side-bars/burger-side-menu.po';
import ProductNavPo from '@/cypress/e2e/po/side-bars/product-side-nav.po';
export class HomeLinksPagePo extends RootClusterPage {
  static url = '/c/_/settings/links'
  static modal = new ModalWithCardPo();
  static goTo(): Cypress.Chainable<Cypress.AUTWindow> {
    return super.goTo(HomeLinksPagePo.url);
  }

  constructor() {
    super(HomeLinksPagePo.url);
  }

  static navTo() {
    const sideNav = new ProductNavPo();

    BurgerMenuPo.burgerMenuNavToMenubyLabel('Global Settings');
    sideNav.navToSideMenuEntryByLabel('Home Links');
  }

  waitForRequests() {
    HomeLinksPagePo.goToAndWaitForGet(this.goTo.bind(this), ['/v1/provisioning.cattle.io.clusters?exclude=metadata.managedFields']);
  }

  selectCheckbox(index: number): CheckboxInputPo {
    return new CheckboxInputPo(`[data-testid="custom-links__checkbox-${ index }"]`);
  }

  addLinkButton() {
    return cy.getId('add_row_item_button');
  }

  removeLinkButton() {
    return cy.getId('remove-column-0');
  }

  displayTextInput() {
    return LabeledInputPo.bySelector(this.self(), '.kv-item.key');
  }

  urlInput(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="value-multiline"]');
  }

  applyButton() {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  applyAndWait(endpoint: string, statusCode?: number): Cypress.Chainable {
    cy.intercept('PUT', endpoint).as(endpoint);
    this.applyButton().click();

    return statusCode ? cy.wait(`@${ endpoint }`).its('response.statusCode').should('eq', statusCode) : cy.wait(`@${ endpoint }`);
  }

  defaultLinkNames(): Cypress.Chainable {
    return this.self().find('.ui-links-setting .kv-item.key > span').should('be.visible');
  }

  checkDefaultLinkName(index: number, text: string) {
    return this.defaultLinkNames().eq(index).then((el) => {
      expect(el.text().trim()).to.equal(text);
    });
  }

  defaultLinkTargets(): Cypress.Chainable {
    return this.self().find('.ui-links-setting .kv-item.value > span').should('be.visible');
  }

  checkDefaultLinkTargets(index: number, text: string) {
    return this.defaultLinkTargets().eq(index).then((el) => {
      expect(el.text().trim()).to.equal(text);
    });
  }

  defaultLinkCheckbox(index: number) {
    return this.self().find('div.link-show-hide-checkbox').eq(index).then((el) => new CheckboxInputPo(el));
  }
}
