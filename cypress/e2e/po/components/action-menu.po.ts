import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ActionMenuPo extends ComponentPo {
  constructor() {
    super(cy.get('main > div > .menu'));
  }

  clickMenuItem(index: number) {
    return this.self().find('li').eq(index).click();
  }
}
