import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberRadioInputPo extends EmberComponentPo {
  // select a radio option matching provided label
  clickLabel(label: string) {
    this.self().find('label').contains(label).click();
  }

  clickIndex(idx:number) {
    this.self().find('input').eq(idx).click();
  }
}
