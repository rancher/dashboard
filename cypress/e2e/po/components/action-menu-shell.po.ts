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

    // Wait for menu items to exist with a more specific error message
    this.self().find('[dropdown-menu-item]').should('exist').then(($items) => {
      if ($items.length === 0) {
        throw new Error(`No dropdown menu items found for menu item "${ name }"`);
      }
    });

    return this.self().find('[dropdown-menu-item]').contains(name);
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
