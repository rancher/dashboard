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
   *
   * `local` keeps its own fixed slot at the top of the cluster area, so it is always directly
   * clickable. Every other cluster lives in the cluster-switcher flyout (the nav shelf shows only
   * pinned/recent) — open the flyout and pick the row there. SURE-8192.
   * @returns {Cypress.Chainable}
   */
  static burgerMenuNavToClusterbyLabel(label: string): Cypress.Chainable {
    if (label !== 'local') {
      new BurgerMenuPo().openClusterSwitcher();

      return new BurgerMenuPo().clusterListRowByLabel(label).click({ force: true });
    }

    return this.sideMenu().should('exist').find('.option .cluster-name').contains(label)
      .click({ force: true });
  }

  /**
   * Check key combo icon for a cluster by its displayed label (any order, pinned or unpinned).
   * @returns {Cypress.Chainable}
   */
  static burgerMenuNavClusterKeyComboIconCheckByLabel(label: string): Cypress.Chainable {
    return this.burgerMenuGetNavClusterByLabel(label)
      .closest('.cluster.selector')
      .find('.cluster-icon-menu i')
      .should('have.class', 'icon-keyboard_tab');
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
  static burgerMenuGetNavClusterByLabel(label: string): Cypress.Chainable {
    return this.sideMenu().find('.option .cluster-name').contains(label);
  }

  /**
   * Check if Cluster Top Level Menu link is highlighted
   */
  static checkIfClusterMenuLinkIsHighlighted(name: string, isHighlightedAssertion = true) {
    const assertion = isHighlightedAssertion ? 'have.class' : 'not.have.class';

    return this.burgerMenuGetNavClusterByLabel(name).parent().parent().should(assertion, 'active-menu-link');
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

  /**
   * Move the real pointer away from the cluster icons.
   *
   * The pointer position is browser-level state that outlives a test, so a spec that hovers an icon
   * leaves the next one starting with the pointer already on it. `realHover` moves the mouse, and a
   * move to where it already is fires no mouseenter — the hover-triggered UI never opens. Hover the
   * burger first so the next `realHover` is a real transition.
   */
  static movePointerOffClusterIcons(): Cypress.Chainable {
    return cy.getId('top-level-menu').realHover();
  }

  static checkIconTooltipOn(content: string): Cypress.Chainable {
    return cy.get('.v-popper__popper .v-popper__inner').should('be.visible').and('contain.text', content);
  }

  static checkIconTooltipOff(): Cypress.Chainable {
    return cy.get('body').find('.v-popper__popper').should('not.exist');
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
    return this.self().find('.body .clusters .cluster.selector.option');
  }

  /**
   * Get the local cluster icon in the side menu to use for hover actions. `local` is the always-present
   * cluster and now sits in its own fixed `.cluster-local` slot (SURE-8192).
   */
  firstClusterIcon(): Cypress.Chainable {
    return this.self().find('.cluster-local .rancher-provider-icon');
  }

  /**
   * Open the cluster-switcher flyout — the estate (ALL CLUSTERS + the search box) lives in there, in
   * both the expanded and the collapsed nav. SURE-8192.
   */
  openClusterSwitcher(): Cypress.Chainable {
    this.self().getId('cluster-switcher-trigger').click();

    return BurgerMenuPo.clusterSwitcherFlyout().should('be.visible');
  }

  /**
   * The cluster-switcher flyout. It is teleported to <body>, so it is NOT inside the side menu.
   */
  static clusterSwitcherFlyout(): Cypress.Chainable {
    return cy.get('body').find('.cluster-switcher-flyout');
  }

  /**
   * Search within the (open) cluster-switcher flyout.
   */
  searchClusters(term: string): Cypress.Chainable {
    return BurgerMenuPo.clusterSwitcherFlyout().find('.switcher-search-input').clear().type(term);
  }

  /**
   * A row in the flyout's ALL CLUSTERS directory matched by its visible label. The flyout must be open
   * (see openClusterSwitcher).
   */
  clusterListRowByLabel(label: string): Cypress.Chainable {
    // Exact-match the cluster name (anchored regex) so a label that is a prefix of another
    // (e.g. "loadtest-1" vs "loadtest-10") cannot select the wrong row. SURE-8192.
    const exact = new RegExp(`^${ label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }$`);

    return BurgerMenuPo.clusterSwitcherFlyout().find('.cluster-switcher-row .row-name').contains(exact)
      .closest('.cluster-switcher-row');
  }

  /**
   * Pin a cluster from the (open) flyout by hovering its row and clicking the pin.
   */
  pinClusterByLabel(label: string): Cypress.Chainable {
    return this.clusterListRowByLabel(label).first().trigger('mouseover').find('.pin')
      .invoke('show')
      .click();
  }

  goToCluster(clusterId = 'local', toggleOpen = true) {
    if (toggleOpen) {
      BurgerMenuPo.toggle();
    }

    this.self().find('.cluster-name').contains(clusterId).should('exist');

    return this.self().find('.cluster-name').contains(clusterId).click({ force: true });
  }

  /**
   * Get all the available cluster rows in the (open) switcher flyout
   * @returns {Cypress.Chainable}
   */
  clusterNotPinnedList(): Cypress.Chainable {
    return BurgerMenuPo.clusterSwitcherFlyout().find('.cluster-switcher-row');
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

  getClusterIcon(clusterName = 'local'): Cypress.Chainable {
    return this.self().find('.cluster-name').contains(clusterName).parent();
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
    return this.self().find('[aria-label="About page link"]');
  }

  /**
   * Get the Get Support link
   * @returns {Cypress.Chainable}
   */
  support(): Cypress.Chainable {
    return this.self().find('[aria-label="Support page link"]');
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
