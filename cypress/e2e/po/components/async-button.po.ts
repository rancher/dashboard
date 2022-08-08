import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class AsyncButtonPo extends ComponentPo {
  click(): Cypress.Chainable {
    return this.self().click();
  }
}
