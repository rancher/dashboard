import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ActionMenuPo extends ComponentPo {
  constructor(arg?:any) {
    super(arg || cy.get('[dropdown-menu-collection]'));
  }

  static open(selector = '[data-testid*="action-button"]') {
    // similar to cypress/e2e/po/side-bars/burger-side-menu.po.ts toggle, however not sure same cause
    cy.get(selector).should('be.visible').click({ force: true }).wait(500); // eslint-disable-line cypress/no-unnecessary-waiting

    return new ActionMenuPo();
  }

  waitForClose() {
    // same as open
    cy.wait(500);// eslint-disable-line cypress/no-unnecessary-waiting
    this.checkNotExists();
  }

  clickMenuItem(index: number) {
    return this.self().find('[dropdown-menu-item]').eq(index).click();
  }

  getMenuItem(name: string) {
    return this.self().get('[dropdown-menu-item]').contains(name);
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
