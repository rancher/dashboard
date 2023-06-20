import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';
import EmberNewSelectPo from '@/cypress/e2e/po/components/embedded-ember/ember-new-select.po';
import EmberTextInputPo from '@/cypress/e2e/po/components/embedded-ember/ember-text-input.po';
import EmberNodeAffinityPo, { MatchExpressionPo, NodeSelectorTermPo } from '@/cypress/e2e/po/components/embedded-ember/ember-node-affinity.po';
import EmberRadioInputPo from '@/cypress/e2e/po/components/embedded-ember/ember-radio.input.po';

export default class EmberPodAffinityPo extends EmberNodeAffinityPo {
  findTerm(idx: number): PodAffinityTermPo {
    return new PodAffinityTermPo(`${ this.selector } [data-testid="pod-affinity-term"]div:nth-child(${ idx + 1 })`);
  }

  allTerms() {
    return cy.getIframeBody().then((iframe) => {
      const queryResult = iframe.find(`${ this.selector } [data-testid="pod-affinity-term"]`);

      if (queryResult?.length > 0) {
        return cy.getIframeBody().find(`${ this.selector } [data-testid="pod-affinity-term"]`);
      }

      return null;
    });
  }

  addTerm() {
    return cy.getIframeBody().find(`${ this.selector } [data-testid="button-add-pod-affinity-term"]`).click();
  }

  editTerm(termData: any, idx:number) {
    const term = this.findTerm(idx);

    if (termData.topology) {
      term.topology().set(termData.topology);
    }
    if (termData.namespaceType) {
      term.namespaceType().clickIndex(termData.namespaceType);
      if (termData.namespaces) {
        term.namespaceList().set(termData.namespaces);
      }
    }

    this._editTerm(termData, idx);
  }
}

export class PodAffinityTermPo extends NodeSelectorTermPo {
  remove() {
    return this.self().find('[data-testid="button-pod-affinity-remove"]').click();
  }

  priority() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-pod-affinity-priority"]`);
  }

  // affinity/anti-affinity
  type() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-pod-affinity-type"]`);
  }

  weight() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="input-pod-affinity-weight"]`);
  }

  topology() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="input-pod-affinity-topology"]`);
  }

  namespaceType() {
    return new EmberRadioInputPo(`${ this.selector } [data-testid="radio-pod-affinity-namespace-type"]`);
  }

  namespaceList() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="input-pod-affinity-namespaces"] input`);
  }
}
