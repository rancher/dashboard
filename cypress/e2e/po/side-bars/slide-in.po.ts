import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class SlideInPo extends ComponentPo {
  constructor() {
    super('[data-testid="slide-in-panel-resource-explain"]');
  }

  waitforContent() {
    return this.self().find('.explain-panel').should('be.visible').within(() => {
      cy.get('.icon-spinner').should('not.exist');
      cy.get('.markdown').should('be.visible');
    });
  }

  closeButton() {
    return this.self().get('[data-testid="slide-in-panel-close-resource-explain"');
  }
}
