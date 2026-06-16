import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class TooltipPo extends ComponentPo {
  /**
   * Show tooltip by triggering mouseenter event
   */
  showTooltip(): Cypress.Chainable {
    return this.self().trigger('mouseenter');
  }

  /**
   * Hide tooltip by triggering mouseleave event
   */
  hideTooltip(): Cypress.Chainable {
    return this.self().trigger('mouseleave');
  }

  /**
   * Get tooltip content element
   */
  getTooltipContent(): Cypress.Chainable {
    return cy.get('.v-popper__popper.v-popper--theme-tooltip .v-popper__inner');
  }

  /**
   * Wait for tooltip to appear and check content
   */
  waitForTooltipWithText(text: string): Cypress.Chainable {
    this.showTooltip();

    return this.getTooltipContent().should('be.visible').and('contain', text);
  }
}
