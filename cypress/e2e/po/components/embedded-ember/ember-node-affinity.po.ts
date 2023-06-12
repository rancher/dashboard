import IframeComponentPo from '@/cypress/e2e/po/components/embedded-ember/iframe-component.po';
import EmberNewSelectPo from '@/cypress/e2e/po/components/embedded-ember/ember-new-select.po';
import EmberTextInputPo from '@/cypress/e2e/po/components/embedded-ember/ember-text-input.po';

export default class EmberNodeAffinityPo extends IframeComponentPo {
  findTerm(idx: number): NodeSelectorTermPo {
    return new NodeSelectorTermPo(`${ this.selector } [data-testid="node-selector-term"]div:nth-child(${ idx + 1 })`);
  }

  allTerms() {
    return cy.getIframeBody().find(`${ this.selector } [data-testid="node-selector-term"]`);
  }

  removeAllTerms() {
    return this.allTerms().its('length').then((l) => {
      let idx = l - 1;

      while (idx >= 0) {
        this.removeTerm(idx);
        idx--;
      }
    });
  }

  removeTerm(idx: number) {
    this.findTerm(idx).remove();
  }

  addTerm() {
    return cy.getIframeBody().find(`${ this.selector } [data-testid="button-add-node-selector"]`).click();
  }

  editTerm(termData: any, idx: number) {
    const term = this.findTerm(idx);

    term.priority().clickOption(termData.priority);
    if (termData.weight) {
      term.weight().set(termData.weight);
    }
    (termData.expressions || []).forEach((matchData: any, i: number) => {
      term.addMatchExpression();
      term.editMatchExpression(matchData, i);
    });
  }
}

export class NodeSelectorTermPo extends IframeComponentPo {
  remove() {
    return this.self().find('[data-testid="button-node-selector-remove"]').click();
  }

  priority() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-node-selector-priority"]`);
  }

  weight() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="input-node-selector-weight"]`);
  }

  addMatchExpression() {
    return cy.getIframeBody().find(`${ this.selector } [data-testid="button-match-expression-add"]`).click();
  }

  findMatchExpression(idx: number) {
    return new MatchExpressionPo(`${ this.selector } [data-testid="match-expressions"] [data-testid="match-expression-row"]tr:nth-child(${ idx + 1 })`);
  }

  editMatchExpression(matchData: any, idx: number) {
    const match = this.findMatchExpression(idx);

    // set matchExpression or matchFields
    if (matchData.matching) {
      match.type().clickOption(matchData.matching);
    }

    match.key().set(matchData.key);
    match.operator().clickOption(matchData.operator);
    // no value is set when key is 'exists' or 'does not exist'  (2 or 3 in matchData)
    if (matchData.value) {
      match.values().set(matchData.value);
    }
  }
}

export class MatchExpressionPo extends IframeComponentPo {
  remove() {
    return this.self().find('[data-testid="button-match-expression-remove"]').click();
  }

  key() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="input-match-expression-key"]`);
  }

  operator() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-match-expression-operator"]`);
  }

  values() {
    return new EmberTextInputPo(`${ this.selector } [data-testid="input-match-expression-values"] input`);
  }

  // matchExpressions or matchFields
  type() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-match-expression-type"]`);
  }
}
