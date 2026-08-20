import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class SlideInPo extends ComponentPo {
  constructor() {
    // The sliding aside, not the panel component inside it: the store unmounts
    // the component 500ms after close, and `checkNotVisible` needs an element
    // that stays in the DOM.
    super('[data-testid="slide-in"]');
  }

  waitforContent() {
    return this.self().find('.explain-panel').should('be.visible').within(() => {
      cy.get('.icon-spinner').should('not.exist');
      cy.get('.markdown').should('be.visible');
    });
  }

  closeButton() {
    return this.self().get('[data-testid="rc-drawer-close"]');
  }
}
