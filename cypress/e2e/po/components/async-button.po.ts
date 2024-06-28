import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class AsyncButtonPo extends ComponentPo {
  click(force = false): Cypress.Chainable {
    return this.self().click({ force });
  }

  expectToBeDisabled(): Cypress.Chainable {
    return this.self().should('have.attr', 'disabled', 'disabled');
  }

  expectToBeEnabled(): Cypress.Chainable {
    return this.self().should('not.have.attr', 'disabled');
  }

  label(name: string): Cypress.Chainable {
    return this.self().contains(name);
  }

  action(label: string, labelDone: string): Cypress.Chainable {
    this.self().contains(label).should('exist');
    this.self().click();

    return this.self().contains(labelDone).should('exist');
  }

  apply(): Cypress.Chainable {
    return this.action('Apply', 'Applied');
  }
}
