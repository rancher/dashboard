import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberSearchableSelectPo from '@/cypress/e2e/po/components/ember/ember-searchable-select.po';
import { CypressChainable } from '@/cypress/e2e/po/po.types';

export default class EmberTolerationsPo extends EmberComponentPo {
  /**
   * Add data to a toleration at given index
   * @param idx index of toleration to be edited
   * @param toleration data to be added where effect and operator are indices of desired value in dropdown
   */
  editToleration(toleration: any, idx:number) {
    const row = this.findRow(idx);

    row.key().set(toleration.key);
    if (toleration.value) {
      row.value().set(toleration.value);
    }
    row.operator().clickAndSelectIndex(toleration.operator);
    row.effect().clickAndSelectIndex(toleration.effect);
    if (toleration.seconds) {
      row.seconds().set(toleration.seconds);
    }
  }

  findRow(idx: number): EmberTolerationRowPo {
    return new EmberTolerationRowPo(`${ this.selector } [data-testid="toleration-row"]tr:nth-child(${ idx + 1 })`);
  }

  addRow() {
    cy.iFrame().find(`${ this.selector } [data-testid="button-add-toleration"]`).click();
  }
}

class EmberTolerationRowPo extends EmberComponentPo {
  key(): EmberInputPo {
    return new EmberInputPo(`${ this.selector } [data-testid="input-toleration-key"]`);
  }

  value(): EmberInputPo {
    return new EmberInputPo(`${ this.selector } [data-testid="input-toleration-value"]`);
  }

  seconds(): EmberInputPo {
    return new EmberInputPo(`${ this.selector } [data-testid="input-toleration-seconds"]`);
  }

  operator(): EmberSearchableSelectPo {
    return new EmberSearchableSelectPo(`${ this.selector } [data-testid="input-toleration-operator"]`);
  }

  effect(): EmberSearchableSelectPo {
    return new EmberSearchableSelectPo(`${ this.selector } [data-testid="input-toleration-effect"]`);
  }
}
