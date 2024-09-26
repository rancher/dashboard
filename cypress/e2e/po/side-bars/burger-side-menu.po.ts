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
    return cy.getId('top-level-menu').should('be.visible').click({ force: true }).wait(500); // eslint-disable-line cypress/no-unnecessary-waiting
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
    return this.self().find('.body .clustersList .cluster.selector.option');
  }

  pinFirstCluster(): Cypress.Chainable {
    return this.clusters().first().trigger('mouseover').find('.pin')
      .invoke('show')
      .click();
  }

  clusterPinnedList(): Cypress.Chainable {
    return this.self().find('.body .clustersPinned .cluster.selector.option');
  }

  unpinFirstCluster(): Cypress.Chainable {
    return this.clusterPinnedList().first().find('.pin').click();
  }

  /**
   * Get the Home link
   * @returns {Cypress.Chainable}
   */
  home(): Cypress.Chainable {
    return this.self().find('.body > div > a').first();
  }

  /**
   * Get the About link
   * @returns {Cypress.Chainable}
   */
  about(): Cypress.Chainable {
    return this.self().contains('About');
  }

  /**
   * Get the Get Support link
   * @returns {Cypress.Chainable}
   */
  support(): Cypress.Chainable {
    return this.self().contains('Get Support');
  }
}
