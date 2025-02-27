import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ActionMenuPo extends ComponentPo {
  constructor(arg:any) {
    super(arg || cy.get('main > div > .menu'));
  }

  clickMenuItem(index: number) {
    return this.self().find('li').eq(index).click();
  }

  getMenuItem(name: string) {
    return this.self().get('[dropdown-menu-item]').contains(name);
  }
}
