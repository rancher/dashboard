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
    return cy.getId('top-level-menu').should('be.visible').click({ force: true });
  }

  /**
   * Navigates to a top-level side menu entry by label (non-cluster)
   * @returns {Cypress.Chainable}
   */
  static burgerMenuNavToMenubyLabel(label: string): Cypress.Chainable {
    return this.sideMenu().should('exist').find('.option div:last-child').contains(label)
      .click();
  }

  /**
   * Navigates to a cluster on a top-level side menu entry by label
   * @returns {Cypress.Chainable}
   */
  static burgerMenuNavToClusterbyLabel(label: string): Cypress.Chainable {
    return this.sideMenu().should('exist').find('.option .cluster-name').contains(label)
      .click();
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
   * Get menu category labels
   * @returns {Cypress.Chainable}
   */
  static categoryByLabel(label: string): Cypress.Chainable {
    return this.sideMenu().find('.body .category', { includeShadowDom: true }).contains(label);
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

  /**
   * Get the Home link
   * @returns {Cypress.Chainable}
   */
  home(): Cypress.Chainable {
    return this.self().find('.body > div > a').first();
  }
}
