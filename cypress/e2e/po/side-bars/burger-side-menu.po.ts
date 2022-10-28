import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class BurgerMenuPo extends ComponentPo {
  constructor() {
    super('[data-testid="side-menu"]');
  }

  /**
   * Toggle side navigation
   * @returns {Cypress.Chainable}
   */
  static toggle(): Cypress.Chainable {
    return cy.getId('top-level-menu').click({ force: true });
  }

  /**
   * Check if menu is open
   */
  static checkOpen() {
    this.sideMenu().should('exist');
  }

  /**
   * Check if menu is closed
   */
  static checkClosed() {
    this.sideMenu().should('not.exist');
  }

  /**
   * Get side navigation
   * @returns {Cypress.Chainable}
   */
  private static sideMenu(): Cypress.Chainable {
    return cy.get('body').getId('side-menu');
  }

  /**
   * Get menu category labels
   * @returns {Cypress.Chainable}
   */
  categories(): Cypress.Chainable {
    return this.self().find('.body .category');
  }

  /**
   * Get all the links of the side navigation
   * @returns {Cypress.Chainable}
   */
  links(): Cypress.Chainable {
    return this.self().find('.body .option');
  }

  /**
   * Get all the available cluster navigation links
   * @returns {Cypress.Chainable}
   */
  clusters(): Cypress.Chainable {
    return this.self().find('.body .clusters .cluster.selector.option');
  }
}
