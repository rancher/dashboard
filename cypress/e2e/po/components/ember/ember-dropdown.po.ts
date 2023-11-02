import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberDropdownPo extends EmberComponentPo {
  getMenuItem(label: string) {
    return this.self().contains(label);
  }

  selectMenuItemByLabel(label: string) {
    return this.self().contains(label).click();
  }
}
