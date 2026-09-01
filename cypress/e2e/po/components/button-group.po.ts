import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ButtonGroupPo extends ComponentPo {
  /**
   * Clicks on the button
   * @param label
   * @returns
   */
  set(label: string): Cypress.Chainable {
    return this.self().contains(label).click();
  }

  /**
   * Checks button is highlighted
   * @param label
   * @returns
   */
  isSelected(label: string): Cypress.Chainable {
    return this.self().find('.btn').contains(label).parent()
      .should('have.class', 'bg-primary');
  }
}
