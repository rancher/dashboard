import ActionMenuPo from '@/cypress/e2e/po/components/action-menu.po';

// cheat, it's not really an action menu but everyone seems to be copy pasting, why don't i??
export default class HeaderPageActionPo extends ActionMenuPo {
  open() {
    return HeaderPageActionPo.open('[data-testid="page-actions-menu-action-button"]');
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
    HeaderPageActionPo.open();

    return HeaderPageActionPo.pageActionsMenu().find('[dropdown-menu-item]');
  }

  /**
   * Get show/hide banner button link
   * @returns {Cypress.Chainable}
   */
  bannerLink(): Cypress.Chainable {
    return this.links().contains('Show/Hide Banner').should('be.visible');
  }
}
