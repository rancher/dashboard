import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberSearchableSelectPo from '@/cypress/e2e/po/components/ember/ember-searchable-select.po';

export default class EmberTolerationsPo extends EmberComponentPo {
  /**
   * Add data to a toleration at given index - assumes a toleration row at that index already exists
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

  removeRow(idx: number) {
    this.findRow(idx).remove();
  }

  allRows(): Cypress.Chainable<any> {
    return cy.iFrame().then((iframe: any) => {
      const queryResult = iframe.find(`${ this.selector } [data-testid="toleration-row"]`);

      if (queryResult?.length > 0) {
        return cy.iFrame().find(`${ this.selector } [data-testid="toleration-row"]`);
      }

      return null;
    });
  }

  /**
   * Remove all toleration rows if they exist- does not assume any rows exist
   * @returns
   */
  removeAllRows() {
    return this.allRows().then((rows: any) => {
      if (rows) {
        let idx = rows.length - 1;

        while (idx >= 0) {
          this.removeRow(idx);
          idx--;
        }
      }
    });
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

  /**
   *
   * @returns Select with [Equals, Exists]
   */
  operator(): EmberSearchableSelectPo {
    return new EmberSearchableSelectPo(`${ this.selector } [data-testid="input-toleration-operator"]`);
  }

  /**
   *
   * @returns Select with [NoSchedule, NoExecute, PreferNoSchedule, All]
   */
  effect(): EmberSearchableSelectPo {
    return new EmberSearchableSelectPo(`${ this.selector } [data-testid="input-toleration-effect"]`);
  }

  remove() {
    return this.self().find('[data-testid="button-toleration-remove"]').click();
  }
}
