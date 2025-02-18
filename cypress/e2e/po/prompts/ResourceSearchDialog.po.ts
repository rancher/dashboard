import ComponentPo from '@/cypress/e2e/po/components/component.po';

// const CMD_K_KEY = {
//   key:      'k',
//   keyCode:  75,
//   which:    75,
//   code:     'KeyK',
//   location: 0,
//   altKey:   false,
//   ctrlKey:  true,
//   metaKey:  false,
//   shiftKey: false,
//   repeat:   false
// };

export default class ResourceSearchDialog extends ComponentPo {
  constructor() {
    super('[data-modal="searchModal"]');
  }

  open() {
    // with PR https://github.com/rancher/dashboard/pull/13369 + https://github.com/rancher/dashboard/pull/1342
    // this stopped working... Can't seem to pinpoint root cause to make it work again. Let's opt for button click
    // cy.keyboardControls(CMD_K_KEY, 1);

    // since it's covered by the namespace transparent backdrop, we need to "force" the click
    cy.get('[data-testid="header-resource-search"]').click({ force: true });
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
