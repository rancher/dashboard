import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';
import EmberTextInputPo from '@/cypress/e2e/po/components/embedded-ember/ember-text-input.po';
import EmberNewSelectPo from '@/cypress/e2e/po/components/embedded-ember/ember-new-select.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class EmberTolerationsPo extends IframeComponentPo {
  /**
   * Add data to a toleration at given index
   * @param idx index of toleration to be edited
   * @param toleration data to be added where effect and operator are indices of desired value in dropdown
   */
  addToleration(toleration: any, idx:number) {
    this.key(idx).set(toleration.key);
    this.value(idx).set(toleration.value);
    this.operator(idx).clickOption(toleration.operator);
    this.effect(idx).clickOption(toleration.effect);
    if (toleration.seconds) {
      this.seconds(idx).set(toleration.seconds);
    }
  }

  rowAtIndex(idx: number): CypressChainable {
    return cy.getIframeBody().find(`[data-testid="toleration-row"]`).eq(idx);
  }

  addRow() {
    this.self().find('[data-testid="button-add-toleration"]').click();
  }

  key(idx: number): EmberTextInputPo {
    return new EmberTextInputPo(this.rowAtIndex(idx).find('[data-testid="input-toleration-key"]'));
  }

  value(idx: number): EmberTextInputPo {
    return new EmberTextInputPo(this.rowAtIndex(idx).find('[data-testid="input-toleration-value"]'));
  }

  seconds(idx: number): EmberTextInputPo {
    return new EmberTextInputPo(this.rowAtIndex(idx).find('[data-testid="input-toleration-seconds"]'));
  }

  operator(idx: number): EmberNewSelectPo {
    return new EmberNewSelectPo(this.rowAtIndex(idx).find('[data-testid="input-toleration-operator"]'));
  }

  effect(idx: number): EmberNewSelectPo {
    return new EmberNewSelectPo(this.rowAtIndex(idx).find('[data-testid="input-toleration-effect"]'));
  }
}
