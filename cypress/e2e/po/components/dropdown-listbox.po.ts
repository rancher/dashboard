import ComponentPo from '~/cypress/e2e/po/components/component.po';

export default class ListBoxPo extends ComponentPo {
  set(label: string): Cypress.Chainable {
    return this.self().contains(label).click();
  }

  isOpened() {
    return this.self().should('exist');
  }

  isClosed() {
    return this.self().should('not.exist');
  }

  getListBoxItems(): Cypress.Chainable {
    return this.self().find('li');
  }
}
