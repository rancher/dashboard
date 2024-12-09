import ComponentPo from '@/cypress/e2e/po/components/component.po';

export class NamespaceFilterPo extends ComponentPo {
  constructor() {
    super('[data-testid="namespaces-filter"]');
  }

  toggle() {
    return this.namespaceDropdown().click({ force: true });
  }

  getOptions(): Cypress.Chainable {
    return this.self().get('.ns-options');
  }

  clickOptionByLabel(label: string) {
    return this.getOptions().contains( new RegExp(` ${ label } `)).click();
  }

  clickOptionByLabelAndWaitForRequest(label: string) {
    cy.intercept('PUT', 'v1/userpreferences/*').as('updatePref');
    this.clickOptionByLabel(label);

    return cy.wait('@updatePref');
  }

  isChecked(label: string) {
    return this.getOptions().contains( new RegExp(` ${ label } `)).find('i')
      .then(($el) => expect($el).have.class('icon-checkmark'));
  }

  checkIcon() {
    return this.self().find('.icon-checkmark');
  }

  namespaceDropdown() {
    return cy.getId('namespaces-dropdown');
  }

  searchByName(label: string) {
    return this.self().find('.ns-controls > .ns-input > .ns-filter-input').clear().type(label);
  }

  clearSearchFilter() {
    return this.self().find('.ns-filter-clear').click();
  }

  clearSelectionButton() {
    return this.self().find('.ns-controls > .ns-clear').click();
  }

  selectedValues() {
    return this.namespaceDropdown().find('[data-testid="namespaces-values"]');
  }

  allSelected() {
    return this.self().find('[data-testid="namespaces-values-none"]').should('exist');
  }

  moreOptionsSelected() {
    return this.namespaceDropdown().find('.ns-more');
  }

  closeDropdown() {
    this.namespaceDropdown().find('.icon-chevron-up').click();
  }
}
