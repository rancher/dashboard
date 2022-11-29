import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class ToggleSwitchPo extends ComponentPo {
  toggle() {
    return this.self().click();
  }
}
