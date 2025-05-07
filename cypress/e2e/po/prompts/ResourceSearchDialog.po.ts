import ComponentPo from '@/cypress/e2e/po/components/component.po';

const CMD_K_KEY = {
  key:      'k',
  keyCode:  75,
  which:    75,
  code:     'KeyK',
  location: 0,
  altKey:   false,
  ctrlKey:  false,
  metaKey:  true,
  shiftKey: false,
  repeat:   false
};

export default class ResourceSearchDialog extends ComponentPo {
  constructor() {
    super('[data-testid="search-modal"]');
  }

  open() {
    cy.keyboardControls(CMD_K_KEY, 1);
  }

  close() {
    cy.get('body').click(10, 10); // Click outside of the search modal
  }

  searchBox() {
    return this.self().get('input.search');
  }

  results() {
    return this.self().get('.results li.child .label');
  }

  /**
   * Use the resource search dialog to go to a specific resource page
   */
  static goToResource(name: string) {
    const dialog = new ResourceSearchDialog();

    dialog.open();
    dialog.checkExists();
    dialog.checkVisible();

    dialog.searchBox().type(name);
    dialog.results().should('have.length', 1);
    dialog.results().first().should('have.text', name);
    dialog.results().first().click();
  }
}
