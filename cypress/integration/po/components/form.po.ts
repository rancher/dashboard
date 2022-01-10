import ComponentPo from '@/cypress/integration/po/components/component.po';

export default class FormPo extends ComponentPo {
  labels(): Cypress.Chainable {
    return this.self().find('.labeled-input');
  }
}
