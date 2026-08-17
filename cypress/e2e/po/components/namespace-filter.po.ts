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
    // Assert the option's checkmark icon is present, retrying until it appears.
    // Match `.icon-checkmark` specifically: project options also render an
    // `.icon-folder`, so a bare `find('i')` can resolve to the folder icon and the
    // one-shot `.then` assertion then flakes (seen as "expected <i.icon-folder> to
    // have class icon-checkmark").
    return this.getOptions().contains( new RegExp(` ${ label } `)).find('i.icon-checkmark')
      .should('exist');
  }

  /**
   * After a clear, the app re-applies the page's forced-default selection asynchronously (a
   * userpreferences round-trip), and the dropdown renders its option list from a cached copy of the
   * filtered options that refreshes a tick later. At Cypress speed a single check can run before that
   * settles and see no checkmark yet. Reopen the dropdown and re-check until the checkmark for `label`
   * appears, so the assertion waits out the settle rather than racing it. (The checkmark does update on
   * its own at human speed, so this is test timing - not an app bug.)
   */
  ensureOptionChecked(label: string, retries = 6): void {
    this.getOptions().contains(new RegExp(` ${ label } `)).then(($row) => {
      if ($row.find('i.icon-checkmark').length > 0) {
        return; // checkmark present - selection verified
      }

      if (retries <= 0) {
        this.isChecked(label); // exhausted - assert once more for a clear failure message

        return;
      }

      this.reopenDropdown();
      this.ensureOptionChecked(label, retries - 1);
    });
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

  /**
   * Clear the selection and wait for the namespace-filter preference update to complete.
   * Clearing resets the filter to its default ("Only User Namespaces") via a userpreferences
   * PUT and a re-render; asserting the new selection's checkmark before that request settles
   * flakes (the checkmark has not rendered yet). Mirrors clickOptionByLabelAndWaitForRequest.
   */
  clearSelectionButtonAndWaitForRequest() {
    cy.intercept('PUT', 'v1/userpreferences/*').as('updatePrefAfterClear');
    this.clearSelectionButton();

    return cy.wait('@updatePrefAfterClear');
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

  /**
   * Close and reopen the dropdown so the option list re-renders from the current (settled) selection
   * state. Clearing the selection empties it and the app asynchronously re-applies a page's forced
   * default via a prefs round-trip; the option list renders from a cached copy of the filtered options
   * that can lag that settle at Cypress speed, so reopening forces a fresh render before we assert the
   * checkmark. (At human speed the checkmark updates in place - this reopen is purely to wait out the
   * async settle in the test.)
   */
  reopenDropdown() {
    this.closeDropdown();
    this.getOptions().should('not.exist');
    this.toggle();

    return this.getOptions().should('be.visible');
  }
}
