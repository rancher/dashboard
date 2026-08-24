import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ActionMenuPo extends ComponentPo {
  constructor(arg:any) {
    super(arg || cy.get('[dropdown-menu-collection]'));
  }

  clickMenuItem(index: number) {
    return this.self().find('[dropdown-menu-item]').eq(index).click();
  }

  getMenuItem(name: string, options?: Partial<Cypress.Timeoutable>) {
    return this.self().find('[dropdown-menu-item]').contains(name, options);
  }

  menuItems(options?: Partial<Cypress.Timeoutable>) {
    return this.self().find('[dropdown-menu-item]', options);
  }

  /**
   * Click the menu item whose text contains `name` if it is present, resolving to whether it was
   * clicked. When the item is absent, close the menu (Escape) and resolve `false` - this lets callers
   * act on an optional item without a hard failure when it is not offered.
   */
  clickMenuItemIfPresent(name: string): Cypress.Chainable<boolean> {
    return this.self().then(($menu) => {
      const item = $menu.find('[dropdown-menu-item]').toArray().find((el) => (el.textContent || '').includes(name));

      if (item) {
        cy.wrap(item).click();

        return cy.wrap(true, { log: false });
      }

      // Not present - close the menu so a follow-up interaction starts from a closed state.
      cy.get('body').type('{esc}');

      return cy.wrap(false, { log: false });
    });
  }

  static checkNoActionMenuIsVisible() {
    return cy.get('[dropdown-menu-collection]:visible').should('have.length', 0);
  }
}
