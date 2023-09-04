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

  static open(): Cypress.Chainable {
    return cy.getId('top-level-menu').should('be.visible').click({ force: true });
  }

  /**
   * Navigates to a top-level side menu entry by label (non-cluster)
   * @returns {Cypress.Chainable}
   */
  static burgerMenuNavToMenubyLabel(label: string): Cypress.Chainable {
    return this.sideMenu().should('exist').find('.option').contains(label)
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
    this.sideMenu().should('have.class', 'menu-open');
  }

  /**
   * Check if menu is closed
   */
  static checkClosed() {
    this.sideMenu().should('have.class', 'menu-close');
  }

  static checkTooltipOn(): Cypress.Chainable {
    return cy.get('.option').get('.cluster-icon-menu').first().should('have.class', 'has-tooltip');
  }

  static checkTooltipOff(): Cypress.Chainable {
    return cy.get('.option').get('.cluster-icon-menu').first().should('have.not.class', 'has-tooltip');
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

  clustersList(): Cypress.Chainable {
    return this.self().find('.body .clustersList .cluster.selector.option');
  }

  pinCluster(): Cypress.Chainable {
    return this.clustersList().first().trigger('mouseover').find('.pin')
      .invoke('show')
      .click();
  }

  pinClustersList(): Cypress.Chainable {
    return this.self().find('.body .clusters .clustersPinned');
  }
  /**
   * Get the Home link
   * @returns {Cypress.Chainable}
   */

  home(): Cypress.Chainable {
    return this.self().find('.body > div > a').first();
  }
}
