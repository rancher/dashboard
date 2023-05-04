import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class TabbedPo extends ComponentPo {
  clickNthTab(optionIndex: number) {
    return this.self().get(`li:nth-child(${ optionIndex }) a`).click();
  }
}
