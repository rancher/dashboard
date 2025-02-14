import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class PageActionsPo extends ComponentPo {
  constructor() {
    super('#page-actions');
  }

  /**
   * Open page actions
   * @returns {Cypress.Chainable}
   */
  static open(): Cypress.Chainable {
    return cy.getId('page-actions-menu-action-button').should('be.visible').click();
  }

  /**
   * Check if page actions menu is open
   */
  static checkOpen() {
    this.pageActionsMenu().should('exist');
  }

  /**
   * Check if page actions menu is closed
   */
  static checkClosed() {
    this.pageActionsMenu().should('not.exist');
  }

  /**
   * Get page actions menu
   * @returns {Cypress.Chainable}
   */
  private static pageActionsMenu(): Cypress.Chainable {
    return cy.get('body').find('[dropdown-menu-collection]');
  }

  /**
   * Open page action menu and get all the links
   * @returns {Cypress.Chainable}
   */
  links(): Cypress.Chainable {
    return PageActionsPo.open().then(() => {
      PageActionsPo.pageActionsMenu().find('[dropdown-menu-item]');
    });
  }

  /**
   * Get restore button link
   * @returns {Cypress.Chainable}
   */
  restoreLink(): Cypress.Chainable {
    return this.links().last();
  }

  /**
   * Get show/hide banner button link
   * @returns {Cypress.Chainable}
   */
  toggleBanner(): Cypress.Chainable {
    return this.links().contains('Show/Hide Banner');
  }
}
