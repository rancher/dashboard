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
    return cy.getId('add_link_button');
  }

  removeLinkButton() {
    return cy.getId('remove-column-0');
  }

  displayTextInput() {
    return LabeledInputPo.bySelector(this.self(), '.kv-item.key');
  }

  urlInput(): LabeledInputPo {
    return new LabeledInputPo('[data-testid="text-area-auto-grow"]');
  }

  applyButton() {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  applyAndWait(endpoint: string): Cypress.Chainable {
    cy.intercept('PUT', endpoint).as(endpoint);
    this.applyButton().apply();

    return cy.wait(`@${ endpoint }`);
  }
}
