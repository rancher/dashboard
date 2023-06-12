import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';
import EmberNewSelectPo from '@/cypress/e2e/po/components/embedded-ember/ember-new-select.po';
import EmberTextInputPo from '@/cypress/e2e/po/components/embedded-ember/ember-text-input.po';
import EmberNodeAffinityPo, { MatchExpressionPo, NodeSelectorTermPo } from '@/cypress/e2e/po/components/embedded-ember/ember-node-affinity.po';
import EmberRadioInputPo from '~/cypress/e2e/po/components/embedded-ember/ember-radio.input.po';

export default class EmberPodAffinityPo extends EmberNodeAffinityPo {
  findTerm(idx: number): PodAffinityTermPo {
    return new PodAffinityTermPo(`${ this.selector } [data-testid="pod-affinity-term"]div:nth-child(${ idx + 1 })`);
  }

  allTerms() {
    return cy.getIframeBody().find(`${ this.selector } [data-testid="pod-affinity-term"]`);
  }

  // removeAllTerms() {
  //   return this.allTerms().its('length').then((l) => {
  //     let idx = l - 1;

  //     while (idx >= 0) {
  //       this.removeTerm(idx);
  //       idx--;
  //     }
  //   });
  // }

  // removeTerm(idx: number) {
  //   this.findTerm(idx).remove();
  // }

  addTerm() {
    return cy.getIframeBody().find(`${ this.selector } [data-testid="button-add-pod-affinity-term"]`).click();
  }

  _editTerm(termData: any, idx:number) {
    // TODO pod stuff
    const term = this.findTerm(idx);

    if (termData.topology) {
      term.topology().set(termData.toplogy);
    }
    if (termData.namespaceType) {
      term.namespaceType().clickIndex(termData.namespaceType);
    }

    this.editTerm(termData, idx);
  }

  // editTerm(termData: any, idx: number) {
  //   const term = this.findTerm(idx);
  //   term.priority().clickOption(termData.priority);
  //   if (termData.weight) {
  //     term.weight().set(termData.weight);
  //   }
  //   (termData.expressions || []).forEach((matchData: any, i: number) => {
  //     term.addMatchExpression();
  //     term.editMatchExpression(matchData, i);
  //   });
  // }
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

  // addMatchExpression() {
  //   return cy.getIframeBody().find(`${ this.selector } [data-testid="button-match-expression-add"]`).click();
  // }

  // findMatchExpression(idx: number) {
  //   return new MatchExpressionPo(`${ this.selector } [data-testid="match-expressions"] [data-testid="match-expression-row"]tr:nth-child(${ idx + 1 })`);
  // }

  // editMatchExpression(matchData: any, idx: number) {
  //   const match = this.findMatchExpression(idx);

  //   // set matchExpression or matchFields
  //   if (matchData.matching) {
  //     match.type().clickOption(matchData.matching);
  //   }

  //   match.key().set(matchData.key);
  //   match.operator().clickOption(matchData.operator);
  //   // no value is set when key is 'exists' or 'does not exist'  (2 or 3 in matchData)
  //   if (matchData.value) {
  //     match.values().set(matchData.value);
  //   }
  // }
}

// class MatchExpressionPo extends IframeComponentPo {
//   remove() {
//     return this.self().find('[data-testid="button-match-expression-remove"]').click();
//   }

//   key() {
//     return new EmberTextInputPo(`${ this.selector } [data-testid="input-match-expression-key"]`);
//   }

//   operator() {
//     return new EmberNewSelectPo(`${ this.selector } [data-testid="select-match-expression-operator"]`);
//   }

//   values() {
//     return new EmberTextInputPo(`${ this.selector } [data-testid="input-match-expression-values"] input`);
//   }

//   // matchExpressions or matchFields
//   type() {
//     return new EmberNewSelectPo(`${ this.selector } [data-testid="select-match-expression-type"]`);
//   }
// }
