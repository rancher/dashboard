import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class LinkPo extends ComponentPo {
  click(force = false): Cypress.Chainable {
    return this.self().click({ force });
  }
}
