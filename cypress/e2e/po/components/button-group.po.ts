import ComponentPo from '~/cypress/e2e/po/components/component.po';

export default class ButtonGroupPo extends ComponentPo {
  /**
   * Click on the button
   */
  set(label: string): Cypress.Chainable {
    return this.self().find('.btn').contains(label).click();
  }

  /**
   * Check is button is highlighted
   */
  isSelected(label: string): Cypress.Chainable {
    return this.self().find('.btn').contains(label).parent().should('have.class', 'bg-primary');
  }
}
