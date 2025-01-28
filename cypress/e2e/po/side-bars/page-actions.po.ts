import ComponentPo from '@/cypress/e2e/po/components/component.po';
import DropdownMenuPo from '@/cypress/e2e/po/components/dropdown-menu.po';

export default class PageActionsPo extends ComponentPo {
  private dropdownMenu: DropdownMenuPo;
  constructor() {
    super('#page-actions');
    this.dropdownMenu = new DropdownMenuPo('[data-testid="page-actions-menu"]');
  }

  /**
   * Open page actions
   * @returns {Cypress.Chainable}
   */
  open(): Cypress.Chainable {
    return this.dropdownMenu.open();
  }

  /**
   * Check if page actions menu is open
   */
  public checkOpen() {
    this.pageActionsMenu().should('exist');
  }

  /**
   * Check if page actions menu is closed
   */
  public checkClosed() {
    this.pageActionsMenu().should('not.exist');
  }

  /**
   * Get page actions menu
   * @returns {Cypress.Chainable}
   */
  private pageActionsMenu(): Cypress.Chainable {
    return this.dropdownMenu.getContainer();
  }

  /**
   * Open page action menu and get all the links
   * @returns {Cypress.Chainable}
   */
  links(): Cypress.Chainable {
    return this.dropdownMenu.getItems();
  }

  /**
   * Get restore button link
   * @returns {Cypress.Chainable}
   */
  restoreLink(): Cypress.Chainable {
    return this.links().last();
  }
}
