import ComponentPo from '@/cypress/e2e/po/components/component.po';
import DropdownMenuPo from '@/cypress/e2e/po/components/dropdown-menu.po';

/**
 * Container PO for the user avatar v-popover
 */
export default class UserMenuPo extends ComponentPo {
  private dropdownMenu: DropdownMenuPo;
  constructor() {
    super('[data-testid="nav_header_showUserMenu"]');
    this.dropdownMenu = new DropdownMenuPo('[data-testid="nav_header_showUserMenu"]');
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
    return this.dropdownMenu.getContainer();
  }

  /**
   * Open the user menu
   */
  open(): Cypress.Chainable {
    return this.dropdownMenu.open();
  }

  /**
   * Check if menu is open
   */
  isOpen() {
    // These should fail if `visibility: hidden` - https://docs.cypress.io/guides/core-concepts/interacting-with-elements#Visibility
    this.userMenuContainer().should('be.visible');
  }

  ensureOpen() {
    // Check the user avatar icon is there
    this.checkVisible();

    this.open();

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
    this.userMenuContainer().should('not.exist');
  }

  /**
   * Get menu items
   * @returns
   */
  getMenuItems(): Cypress.Chainable {
    return this.dropdownMenu.getItems().should('be.visible').and('have.length', 3);
  }

  /**
   * label: 'Preferences', 'Account & API Keys', or 'Log Out'
   * @param label
   * @returns
   */
  getMenuItem(label: 'Preferences' | 'Account & API Keys' | 'Log Out') {
    return this.ensureOpen().then(() => this.getMenuItems().contains(label));
  }

  /**
   * label: 'Preferences', 'Account & API Keys', or 'Log Out'
   * @param label
   * @returns
   */
  clickMenuItem(label: 'Preferences' | 'Account & API Keys' | 'Log Out') {
    return this.getMenuItem(label).click();
  }
}
