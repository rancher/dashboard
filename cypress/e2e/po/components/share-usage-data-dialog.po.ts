import ComponentPo from '@/cypress/e2e/po/components/component.po';
import RadioGroupInputPo from '@/cypress/e2e/po/components/radio-group-input.po';

export default class ShareUsageDataDialogPo extends ComponentPo {
  constructor() {
    super('[data-testid="share-usage-data-options"]');
  }

  options() {
    return new RadioGroupInputPo('[data-testid="share-usage-data-options"]');
  }

  details() {
    return cy.get('[data-testid="share-usage-data-details"]');
  }

  detailsToggle() {
    return cy.get('[data-testid="share-usage-data-details-toggle"]');
  }

  required() {
    return cy.get('.share-usage-data__required');
  }

  confirmButton() {
    return cy.get('[data-testid="share-usage-data-confirm"]');
  }
}
