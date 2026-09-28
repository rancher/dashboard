import ComponentPo from '@/cypress/e2e/po/components/component.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';

export default class NodeSchedulingPo extends ComponentPo {
  constructor(selector = '[data-testid="node-scheduling-selectNode"]') {
    super(selector);
  }

  selectNodeRadio(): RadioGroupInputPo {
    return new RadioGroupInputPo('[data-testid="node-scheduling-selectNode"]');
  }

  selectAnyNode() {
    return this.selectNodeRadio().set(0);
  }

  selectSpecificNode() {
    return this.selectNodeRadio().set(1);
  }

  selectSchedulingRules() {
    return this.selectNodeRadio().set(2);
  }

  isAnyNodeChecked() {
    return this.selectNodeRadio().isChecked(0);
  }

  isSpecificNodeChecked() {
    return this.selectNodeRadio().isChecked(1);
  }

  isSchedulingRulesChecked() {
    return this.selectNodeRadio().isChecked(2);
  }

  nodeSelector(): Cypress.Chainable {
    return cy.get('[data-testid="node-scheduling-nodeSelector"]');
  }

  nodeSelectorNotExist(): Cypress.Chainable {
    return cy.get('[data-testid="node-scheduling-nodeSelector"]').should('not.exist');
  }
}
