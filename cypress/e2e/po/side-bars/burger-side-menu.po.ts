import ComponentPo, { GetOptions } from '@/cypress/e2e/po/components/component.po';

export default class BurgerMenuPo extends ComponentPo {
  constructor() {
    super('[data-testid="side-menu"]');
  }

  /**
   * Toggle side navigation
   * @returns {Cypress.Chainable}
   */
  static toggle(): Cypress.Chainable {
    // added wait of 500ms to make time for CSS transitions to resolve (addresses tests flakiness)
    // unfortunately there's no "easy" (and foolproof) way of waiting for transitions and 500ms is quick and does the trick
    return cy.getId('top-level-menu').should('be.visible').click({ force: true }).wait(500); // eslint-disable-line cypress/no-unnecessary-waiting
  }

  /**
   * Navigates to a top-level side menu entry by label (non-cluster)
   * @returns {Cypress.Chainable}
   */
  static burgerMenuNavToMenubyLabel(label: string, options?: GetOptions): Cypress.Chainable {
    return this.sideMenu().should('exist').find('.option').contains(label, options)
      .click({ force: true });
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
   * Check if cluster on a top-level side menu entry by entry index has the appropriate key combo icon
   * @returns {Cypress.Chainable}
   */
  static burgerMenuNavClusterKeyComboIconCheck(index: number): Cypress.Chainable {
    return this.sideMenu().should('exist').find(`.clustersList [data-testid="top-level-menu-cluster-${ index }"] .cluster-icon-menu i`).should('have.class', 'icon-keyboard_tab');
  }

  /**
   * Get menu navigation item by label
   * @returns {Cypress.Chainable}
   */
  static burgerMenuGetNavMenubyLabel(label: string): Cypress.Chainable {
    return this.sideMenu().find('.option').contains(label);
  }

  /**
   * Get cluster navigation item by label
   * @returns {Cypress.Chainable}
   */
  static burgerMenuGetNavClusterbyLabel(label: string): Cypress.Chainable {
    return this.sideMenu().find('.option .cluster-name').contains(label);
  }

  /**
   * Check if Cluster Top Level Menu link is highlighted
   */
  static checkIfClusterMenuLinkIsHighlighted(name: string, isHighlightedAssertion = true) {
    const assertion = isHighlightedAssertion ? 'have.class' : 'not.have.class';

    return this.burgerMenuGetNavClusterbyLabel(name).parent().parent().should(assertion, 'active-menu-link');
  }

  /**
   * Check if non-cluster Top Level Menu link is highlighted
   */
  static checkIfMenuItemLinkIsHighlighted(name: string) {
    return this.burgerMenuGetNavMenubyLabel(name).parent().should('have.class', 'active-menu-link');
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

  static checkIconTooltipOn(): Cypress.Chainable {
    return cy.get('.option').get('.cluster-icon-menu').first().should('have.class', 'v-popper--has-tooltip');
  }

  static checkIconTooltipOff(): Cypress.Chainable {
    return cy.get('.option').get('.cluster-icon-menu').first().should('have.not.class', 'v-popper--has-tooltip');
  }

  /**
   * Get side navigation
   * @returns {Cypress.Chainable}
   */
  static sideMenu(): Cypress.Chainable {
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
   * Get all clusters, whether pinned, filtered or not
   */
  allClusters(): Cypress.Chainable {
    return this.self().find('.body .cluster.selector.option');
  }

  goToCluster(clusterId = 'local', toggleOpen = true) {
    if (toggleOpen) {
      BurgerMenuPo.toggle();
    }

    this.self().find('.cluster-name').contains(clusterId).should('exist');

    return this.self().find('.cluster-name').contains(clusterId).click();
  }

  /**
   * Get all the available cluster navigation links
   * @returns {Cypress.Chainable}
   */
  clusterNotPinnedList(): Cypress.Chainable {
    return this.self().find('.body .clustersList .cluster.selector.option');
  }

  pinFirstCluster(): Cypress.Chainable {
    return this.clusterNotPinnedList().first().trigger('mouseover').find('.pin')
      .invoke('show')
      .click();
  }

  clusterPinnedList(): Cypress.Chainable {
    return this.self().find('.body .clustersPinned .cluster.selector.option');
  }

  unpinFirstCluster(): Cypress.Chainable {
    return this.clusterPinnedList().first().find('.pin').click();
  }

  getClusterDescription(): Cypress.Chainable {
    return this.clusterNotPinnedList().first().find('.description').invoke('text');
  }

  showClusterDescriptionTooltip(): Cypress.Chainable {
    return this.clusterNotPinnedList().first().find('.description').trigger('mouseenter');
  }

  getClusterDescriptionTooltipContent(): Cypress.Chainable {
    return cy.get('.v-popper__popper .v-popper__inner');
  }

  /**
   * Get the Home link
   * @returns {Cypress.Chainable}
   */
  home(): Cypress.Chainable {
    return this.self().find('.body > div > div > a').first();
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

  /**
    * Get the side menu logo image
   * @returns
   */
  brandLogoImage(): Cypress.Chainable {
    return cy.getId('side-menu__brand-img');
  }

  /**
   * Get the header logo image
   * @returns
   */
  headerBrandLogoImage(): Cypress.Chainable {
    return cy.getId('header__brand-img');
  }
}
