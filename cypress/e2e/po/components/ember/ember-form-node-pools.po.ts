import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberCheckboxInputPo from '@/cypress/e2e/po/components/ember/ember-checkbox-input.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberSelectPo from '@/cypress/e2e/po/components/ember/ember-select.po';

export default class EmberFormNodePoolsPo extends EmberComponentPo {
  addNodePool() {
    return cy.iFrame().find('button').contains('Add Node Pool').click();
  }

  /**
   * set node name
   * @param index
   * @returns
   */
  name(index: number) {
    return new EmberInputPo(`.sortable-table .main-row:nth-of-type(${ index }) td:nth-of-type(1) input`);
  }

  /**
   * set node count
   * @param index
   * @returns
   */
  count(index: number) {
    return new EmberInputPo(`.sortable-table .main-row:nth-of-type(${ index }) td:nth-of-type(2) input`);
  }

  /**
   * select node template
   * @param index
   * @returns
   */
  template(index: number) {
    return new EmberSelectPo(`.sortable-table .main-row:nth-of-type(${ index }) td:nth-of-type(3) select optgroup`);
  }

  /**
   * set etcd
   * @param index
   * @returns
   */
  etcd(index: number) {
    return new EmberCheckboxInputPo(`.sortable-table .main-row:nth-of-type(${ index }) td:nth-of-type(6)`);
  }

  /**
   * set control plane
   * @param index
   * @returns
   */
  controlPlane(index: number) {
    return new EmberCheckboxInputPo(`.sortable-table .main-row:nth-of-type(${ index }) td:nth-of-type(7)`);
  }

  /**
   * set worker
   * @param index
   * @returns
   */
  worker(index: number) {
    return new EmberCheckboxInputPo(`.sortable-table .main-row:nth-of-type(${ index }) td:nth-of-type(8)`);
  }
}
