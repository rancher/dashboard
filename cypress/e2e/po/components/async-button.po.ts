import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class AsyncButtonPo extends ComponentPo {
  click(): Cypress.Chainable {
    return this.self().click();
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
