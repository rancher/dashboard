import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ActionMenuPo extends ComponentPo {
  constructor(arg?:any) {
    if (arg) {
      super(arg);
    } else {
      // Ensure dropdown menu collection exists before creating the component
      cy.get('[dropdown-menu-collection]', { timeout: 10000 }).should('be.visible');
      super(cy.get('[dropdown-menu-collection]'));
    }
  }

  clickMenuItem(index: number) {
    return this.self().find('[dropdown-menu-item]').eq(index).click();
  }

  getMenuItem(name: string) {
    // Ensure dropdown menu items are loaded before searching
    this.self().find('[dropdown-menu-item]').should('have.length.at.least', 1);

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
