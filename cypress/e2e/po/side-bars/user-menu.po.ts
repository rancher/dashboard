import ComponentPo from '@/cypress/e2e/po/components/component.po';

/**
 * Container PO for the user avatar v-popover
 */
export default class UserMenuPo extends ComponentPo {
  constructor() {
    super('[data-testid="nav_header_showUserMenu"]');
  }

  /**
   * Transient v-popover container
   *
   * This is added to the dom when the user clicks on the avatar.
   *
   * When added to the dom it may not yet be visible
   *
   */
  private userMenuContainer() {
    return this.self().get('.tooltip.popover.vue-popover-theme');
  }

  /**
   * Our section within the transient userMenuContainer
   */
  userMenu(): Cypress.Chainable {
    return this.self().getId(`user-menu-dropdown`);
  }

  /**
   * Open the user menu
   *
   * Multiple clicks because sometimes just one ... isn't enough
   *
   */
  open(): Cypress.Chainable {
    this.self().click();
    this.self().click();
    this.self().click();
    this.self().click();
  }

  /**
   * Check if menu is open
   */
  isOpen() {
    // These should fail if `visibility: hidden` - https://docs.cypress.io/guides/core-concepts/interacting-with-elements#Visibility
    this.userMenuContainer().should('be.visible');
    this.userMenu().should('be.visible');
  }

  ensureOpen() {
    // Check the user avatar icon is there
    this.checkVisible();

    // Yep, these are _horrible_, but flakey user avatar tests have plagued us for months and no-one has yet fixed them
    // This is a temporary step until that brave, tenacious champion of e2e resolves the underlying issue.
    cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting
    this.open();
    cy.wait(1000); // eslint-disable-line cypress/no-unnecessary-waiting

    // Check the v-popper drop down is open, if not open it
    // This isn't a pattern we want to use often, but this area has caused us lots of issues
    // (userMenu can be visible pass checks... but not the parent... making userMenu not visible)
    return this.userMenuContainer().should('have.length.gte', 0)
      .then(($el) => {
        if ($el.length) {
          // It's meant to be open.... but is it visible? (clicks away from popover will hide it before removing from dom)
          if ($el.attr('style')?.includes('visibility: hidden')) {
            cy.log('User Avatar open but hidden, giving it a nudge');

            return this.open();
          }
        } else {
          cy.log('User Avatar not open, opening');

          return this.open();
        }
      })
      .then(() => this.isOpen());
  }

  /**
   * Check if menu is closed
   */
  isClosed() {
    this.userMenu().should('not.exist');
  }

  /**
   * Get menu items
   * @returns
   */
  getMenuItems(): Cypress.Chainable {
    return this.userMenu().find('li').should('be.visible').and('have.length', 4);
  }

  /**
   * label: 'Preferences', 'Account & API Keys', or 'Log Out'
   * @param label
   * @returns
   */
  clickMenuItem(label: 'Preferences' | 'Account & API Keys' | 'Log Out') {
    this.ensureOpen().then(() => {
      return this.getMenuItems().contains(label).click();
    });
  }
}
