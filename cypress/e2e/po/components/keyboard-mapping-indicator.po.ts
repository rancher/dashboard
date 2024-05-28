import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class KeyboardMappingIndicatorPo extends ComponentPo {
  constructor() {
    super('[data-testid="code-mirror-keymap"]');
  }

  showTooltip(): Cypress.Chainable {
    return this.self().trigger('mouseenter');
  }

  getTooltipContent(): Cypress.Chainable {
    return cy.get('.tooltip.vue-tooltip-theme .tooltip-inner');
  }
}
