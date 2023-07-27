import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';

export default class EmberRadioInputPo extends EmberComponentPo {
/**
 * Select radio option with given label
 * @param label
 */
  clickLabel(label: string) {
    this.self().find('label').contains(label).click();
  }

  /**
     * Select nth radio option
     * @param idx index of radio option to select
     */
  clickIndex(idx:number) {
    this.self().find('input').eq(idx).click();
  }
}
