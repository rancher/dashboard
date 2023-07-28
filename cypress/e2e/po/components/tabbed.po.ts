import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class TabbedPo extends ComponentPo {
  constructor(selector = '.dashboard-root') {
    super(selector);
  }

  clickNthTab(optionIndex: number) {
    return this.self().get(`li:nth-child(${ optionIndex }) a`).click();
  }

  clickTabWithSelector(selector: string) {
    return this.self().get(`${ selector }`).click();
  }
}
