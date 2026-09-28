import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';

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
  getTooltipContent(options?: GetOptions): Cypress.Chainable {
    return cy.get('.v-popper__popper.v-popper--theme-tooltip .v-popper__inner', options);
  }

  /**
   * Wait for tooltip to appear and check content
   * @param text Expected tooltip text
   * @param options Optional cy get() options (e.g. a longer `timeout`) for the content
   * assertion - useful when the tooltip text depends on async UI state (e.g. a version
   * that updates only after an install/upgrade action has fully completed).
   */
  waitForTooltipWithText(text: string, options?: GetOptions): Cypress.Chainable {
    this.showTooltip();

    return this.getTooltipContent(options).should('be.visible').and('contain', text);
  }
}
