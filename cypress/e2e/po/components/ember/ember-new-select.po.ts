import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberNewSelectPo extends EmberComponentPo {
  clickOptionIdx(idx: number) {
    this.self().find('select').select(idx);
  }

  clickOption(option: string) {
    this.self().find('select').select(option);
  }
}
