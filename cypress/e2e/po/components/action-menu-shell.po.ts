import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ActionMenuPo extends ComponentPo {
  constructor(arg?:any) {
    super(arg || cy.get('[dropdown-menu-collection]'));
  }

  clickMenuItem(index: number) {
    return this.self().find('[dropdown-menu-item]').eq(index).click();
  }

  checkNoActionsAvailable(present = true) {
    if (present) {
      return this.self().should('contain', 'No actions available');
    } else {
      return this.self().should('not.contain', 'No actions available');
    }
  }

  atLeastOneActiveMenuItem() {
    return this.self().find('[dropdown-menu-item]:not([disabled])').should('exist');
  }

  getMenuItem(name: string) {
    return this.self().contains('[dropdown-menu-item]', name);
  }

  waitForMenuItem(name: string) {
    return this.getMenuItem(name).should('be.visible');
  }

  menuItemNames() {
    return this.self().get('[dropdown-menu-item]').then(($els) => {
      return (
        Cypress.$.makeArray($els)
          // and extract inner text from each
          .map((el) => el.innerText)
      );
    });
  }
}
