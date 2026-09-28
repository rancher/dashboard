import ComponentPo from '@/cypress/e2e/po/components/component.po';

/**
 * The toolbar pinned above the side nav: the jump-to search and the collapse-all
 * control. The results dropdown is teleported to `body`, so it is queried from
 * the document rather than from within the toolbar.
 */
export default class NavActionBarPo extends ComponentPo {
  constructor() {
    super('.nav-action-bar');
  }

  /**
   * The jump-to search input
   */
  jumpToInput(): Cypress.Chainable {
    return this.self().find('[data-testid="nav-jump-to-input"]');
  }

  /**
   * Focus the jump-to input, which opens the results dropdown
   */
  openJumpTo(): Cypress.Chainable {
    this.jumpToInput().focus();

    return this.jumpToDropdown().should('be.visible');
  }

  /**
   * Type into the jump-to input
   */
  searchJumpTo(query: string): Cypress.Chainable {
    return this.jumpToInput().clear().type(query);
  }

  /**
   * The results dropdown, teleported out of the nav to `body`
   */
  jumpToDropdown(): Cypress.Chainable {
    return cy.get('[data-testid="nav-jump-to-dropdown"]');
  }

  /**
   * The result rows currently offered
   */
  jumpToResults(): Cypress.Chainable {
    return this.jumpToDropdown().find('[data-testid="nav-jump-to-option"]');
  }

  /**
   * The labels of the result rows currently offered
   */
  jumpToResultLabels(): Cypress.Chainable {
    return this.jumpToResults().find('.jump-to-option-label');
  }

  /**
   * The collapse-all control, only rendered while a group is expanded
   */
  collapseAllButton(): Cypress.Chainable {
    return this.self().find('[data-testid="nav-collapse-all"]');
  }
}
