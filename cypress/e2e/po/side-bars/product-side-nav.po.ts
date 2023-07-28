import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ProductNavPo extends ComponentPo {
  constructor() {
    super('.side-nav');
  }

  /**
   * Get all navigation accordion groups
   * @returns {Cypress.Chainable}
   */
  groups(): Cypress.Chainable {
    return this.self().find('.accordion.has-children');
  }

  /**
   * Get all the expanded accordion groups
   * @returns
   */
  expandedGroup(): Cypress.Chainable {
    return this.self().find('.accordion.expanded');
  }

  /**
   * Get all the visible child links
   */
  visibleNavTypes(): Cypress.Chainable {
    return this.self().find('.accordion.expanded li.nav-type>a');
  }

  /**
   * Navigate to a side menu group by label
   */
  navToSideMenuGroupByLabel(label: string): Cypress.Chainable {
    return this.self().should('exist').find('.header > a > h6').contains(label)
      .click();
  }

  /**
   * Navigate to a side menu entry by label
   */
  navToSideMenuEntryByLabel(label: string): Cypress.Chainable {
    return this.self().should('exist').find('.child.nav-type a .label').contains(label)
      .click();
  }
}
