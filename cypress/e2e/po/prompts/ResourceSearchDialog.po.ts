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
    super('[data-modal="searchModal"]');
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
}
