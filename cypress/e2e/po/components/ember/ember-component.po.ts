import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class EmberComponentPo extends ComponentPo {
  // Note - only selector ctor allowed

  self = () => {
    return cy.iFrame().find(this.selector);
  }
}
