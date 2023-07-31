import EmberInputPo from '@/cypress/e2e/po/components/ember/ember-input.po';
import EmberComponentPo from '@/cypress/e2e/po/components/ember/ember-component.po';
import EmberNewSelectPo from '@/cypress/e2e/po/components/ember/ember-new-select.po';

export default class EmberNodeAffinityPo extends EmberComponentPo {
  findTerm(idx: number): NodeSelectorTermPo {
    return new NodeSelectorTermPo(`${ this.selector } [data-testid="node-selector-term"]div:nth-child(${ idx + 1 })`);
  }

  /**
   *
   * @returns array of node affinity term elements, or null if none are defined
   */
  allTerms(): Cypress.Chainable<any> {
    return cy.iFrame().then((iframe: any) => {
      const queryResult = iframe.find(`${ this.selector } [data-testid="node-selector-term"]`);

      if (queryResult?.length > 0) {
        return cy.iFrame().find(`${ this.selector } [data-testid="node-selector-term"]`);
      }

      return null;
    });
  }

  /**
   * Remove existing node affinity terms - does not assume any are defined
   * @returns
   */
  removeAllTerms() {
    return this.allTerms().then((terms: any) => {
      if (terms) {
        let idx = terms.length - 1;

        while (idx >= 0) {
          this.removeTerm(idx);
          idx--;
        }
      }
    });
  }

  removeTerm(idx: number) {
    this.findTerm(idx).remove();
  }

  addTerm() {
    return cy.iFrame().find(`${ this.selector } [data-testid="button-add-node-selector"]`).click();
  }

  /**
   * Edit a node affinity term - assumes term at given index exists
   * Priority and weight are overwritted if provided; match expressions/fields are appended
   * @param termData
   * @param idx
   */
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

export class NodeSelectorTermPo extends EmberComponentPo {
  remove() {
    return this.self().find('[data-testid="button-node-selector-remove"]').click();
  }

  priority() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-node-selector-priority"]`);
  }

  weight() {
    return new EmberInputPo(`${ this.selector } [data-testid="input-node-selector-weight"]`);
  }

  addMatchExpression() {
    return cy.iFrame().find(`${ this.selector } [data-testid="button-match-expression-add"]`).click();
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

export class MatchExpressionPo extends EmberComponentPo {
  remove() {
    return this.self().find('[data-testid="button-match-expression-remove"]').click();
  }

  key() {
    return new EmberInputPo(`${ this.selector } [data-testid="input-match-expression-key"]`);
  }

  /**
   *
   * @returns Select with options [InList, NotInList, Exists, DoesNoeExist, GreaterThan, LessThan]
   */
  operator() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-match-expression-operator"]`);
  }

  values() {
    return new EmberInputPo(`${ this.selector } [data-testid="input-match-expression-values"] input`);
  }

  /**
   *
   * @returns select with options [matchExpressions, matchFields]
   */
  type() {
    return new EmberNewSelectPo(`${ this.selector } [data-testid="select-match-expression-type"]`);
  }
}
