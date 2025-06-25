import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ActionMenuPo extends ComponentPo {
  constructor(arg:any) {
    super(arg || cy.get('[dropdown-menu-collection]'));
  }

  clickMenuItem(index: number) {
    return this.self().find('[dropdown-menu-item]').eq(index).click();
  }

  getMenuItem(name: string) {
    return this.self().get('[dropdown-menu-item]').contains(name);
  }
}
