import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';
import CheckboxInputPo from '@/cypress/e2e/po/components/checkbox-input.po';
import ColorInputPo from '@/cypress/e2e/po/components/color-input.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class CustomBadgeDialogPo extends ComponentPo {
  constructor(selector = '[data-testid="card"]') {
    super(selector);
  }

  badgePreview() {
    return cy.get('.badge-preview');
  }

  clusterIcon(): Cypress.Chainable {
    return this.badgePreview().find('.cluster-icon');
  }

  clusterName() {
    return this.badgePreview().find('.cluster-name');
  }

  customBadge() {
    return this.badgePreview().find('.cluster-badge');
  }

  selectCheckbox(label:string): CheckboxInputPo {
    return CheckboxInputPo.byLabel(this.self(), label);
  }

  badgeCustomDescription(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Custom comment');
  }

  colorPicker(): ColorInputPo {
    return new ColorInputPo(cy.getId('color-input-color-input'));
  }

  iconText(): LabeledInputPo {
    return LabeledInputPo.byLabel(this.self(), 'Icon Text');
  }

  applyButton() {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  applyAndWait(endpoint: string) {
    cy.intercept('PUT', endpoint).as(endpoint);
    this.applyButton().click();
    cy.wait(`@${ endpoint }`).its('response.statusCode').should('eq', 200);
  }
}
