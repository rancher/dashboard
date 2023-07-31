import EmberNewSelectPo from '@/cypress/e2e/po/components/ember/ember-new-select.po';
import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberNodeAffinityPo, { NodeSelectorTermPo } from '@/cypress/e2e/po/components/ember/ember-node-affinity.po';
import EmberRadioInputPo from '@/cypress/e2e/po/components/ember/ember-radio.input.po';

export default class EmberPodAffinityPo extends EmberNodeAffinityPo {
  findTerm(idx: number): PodAffinityTermPo {
    return new PodAffinityTermPo(`${ this.selector } [data-testid="pod-affinity-term"]div:nth-child(${ idx + 1 })`);
  }

  /**
   *
   * @returns array of all existing pod affinity term dom elements, or null if none are defined
   */
  allTerms() {
    return cy.iFrame().then((iframe: any) => {
      const queryResult = iframe.find(`${ this.selector } [data-testid="pod-affinity-term"]`);

      if (queryResult?.length > 0) {
        return cy.iFrame().find(`${ this.selector } [data-testid="pod-affinity-term"]`);
      }

      return null;
    });
  }

  addTerm() {
    return cy.iFrame().find(`${ this.selector } [data-testid="button-add-pod-affinity-term"]`).click();
  }

  /**
   * Edit term at a given index - assumes term at that index already exisits
   * termData topology, namespace type, affinity type, and priority overwrite existing options; expressions are appended
   * @param termData
   * @param idx
   */
  editTerm(termData: any, idx:number) {
    const term = this.findTerm(idx);

    term.type().clickOption(termData.affinityType);

    if (termData.topology) {
      term.topology().set(termData.topology);
    }
    if (termData.namespaceType !== undefined) {
      term.namespaceType().clickIndex(termData.namespaceType);
      if (termData.namespaces) {
        term.namespaceList().set(termData.namespaces);
      }
    }

    super.editTerm(termData, idx);
  }
}

export class PodAffinityTermPo extends NodeSelectorTermPo {
  remove() {
    return this.self().find('[data-testid="button-pod-affinity-remove"]').click();
  }

  /**
   *
   * @returns Select with options [required, preferred]
   */
  priority() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-pod-affinity-priority"]`);
  }

  /**
   *
   * @returns Select with options [antiAffinity, affinity]
   */
  type() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-pod-affinity-type"]`);
  }

  weight() {
    return new EmberInputPo(`${ this.selector } [data-testid="input-pod-affinity-weight"]`);
  }

  topology() {
    return new EmberInputPo(`${ this.selector } [data-testid="input-pod-affinity-topology"]`);
  }

  /**
   *
   * @returns Radio with options [this pods namespace, all namespaces, pods in these namespaces]
   */
  namespaceType() {
    return new EmberRadioInputPo(`${ this.selector } [data-testid="radio-pod-affinity-namespace-type"]`);
  }

  namespaceList() {
    return new EmberInputPo(`${ this.selector } [data-testid="input-pod-affinity-namespaces"] input`);
  }
}
