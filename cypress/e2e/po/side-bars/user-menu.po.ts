import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class UserMenuPo extends ComponentPo {
  constructor() {
    super('[data-testid="nav_header_showUserMenu"]');
  }

  userMenuDropdown(): Cypress.Chainable {
    return cy.getId('user-menu-dropdown');
  }

  /**
   * Toggle user menu
   * @returns
   */
  toggle(): Cypress.Chainable {
    this.self().should('be.visible');
    const popover = this.self().find('.v-popover');

    popover.should('be.visible');

    return popover.click({ force: true });
  }

  /**
   * Check if menu is open
   */
  isOpen() {
    this.userMenuDropdown().should('be.visible');
  }

  /**
   * Check if menu is closed
   */
  isClosed() {
    this.userMenuDropdown().should('not.exist');
  }

  /**
   * Get menu items
   * @returns
   */
  getMenuItems(): Cypress.Chainable {
    return this.userMenuDropdown().find('li').should('be.visible').and('have.length', 4);
  }

  /**
   * label: 'Preferences', 'Account & API Keys', or 'Log Out'
   * @param label
   * @returns
   */
  clickMenuItem(label: string) {
    return this.getMenuItems().contains(label).click({ force: true });
  }
}
