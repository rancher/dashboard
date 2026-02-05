import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ActionMenuPo extends ComponentPo {
  constructor(arg?:any) {
    if (arg) {
      super(arg);
    } else {
      // Get the most recently opened/visible dropdown menu collection
      super(cy.get('[dropdown-menu-collection]:visible').last());
    }
  }

  clickMenuItem(index: number) {
    return this.self().find('[dropdown-menu-item]').eq(index).click();
  }

  getMenuItem(name: string) {
    // First ensure the dropdown collection exists and is visible
    cy.get('[dropdown-menu-collection]:visible').should('exist');

    // Wait for the dropdown to be properly rendered and not show "No actions available"
    cy.get('[dropdown-menu-collection]:visible').should('not.contain', 'No actions available');

    // Wait for menu items to be populated - use retry logic for async loading
    cy.get('[dropdown-menu-collection]:visible').within(() => {
      cy.get('[dropdown-menu-item]:not([disabled])').should('have.length.greaterThan', 0);
    });

    // Now find the specific menu item using global selector for reliability
    return cy.get('[dropdown-menu-collection]:visible [dropdown-menu-item]').contains(name).should('be.visible');
  }

  menuItemNames() {
    return this.self().find('[dropdown-menu-item]').then(($els) => {
      return (
        Cypress.$.makeArray($els)
          // and extract inner text from each
          .map((el) => el.innerText)
      );
    });
  }
}
