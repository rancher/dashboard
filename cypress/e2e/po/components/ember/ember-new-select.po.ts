import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberNewSelectPo extends EmberComponentPo {
  clickOptionIdx(idx: number) {
    // this.open();
    // this.getOptions().eq(idx).click();
    this.self().find('select').select(idx);
  }

  clickOption(option: string) {
    // this.open();
    // this.getOptions().eq(idx).click();
    this.self().find('select').select(option);
  }
}
