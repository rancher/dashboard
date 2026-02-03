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
    // Wait for dropdown menu to be ready and items to be populated
    this.self().should('be.visible');

    // Wait for dropdown content to be fully loaded - check for loading indicators
    this.self().should('not.contain', 'Loading...');
    this.self().should('not.have.class', 'loading');

    // Wait for menu items to exist and be populated (more than 0)
    this.self().find('[dropdown-menu-item]').should('have.length.greaterThan', 0);

    // Additional wait to ensure items are interactable
    this.self().find('[dropdown-menu-item]').should('be.visible');

    // Find the specific menu item, with retry logic
    return this.self().find('[dropdown-menu-item]').contains(name).should('be.visible');
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
