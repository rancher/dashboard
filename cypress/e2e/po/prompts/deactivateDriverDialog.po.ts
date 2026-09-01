import ComponentPo from '@/cypress/e2e/po/components/component.po';
import BannersPo from '@/cypress/e2e/po/components/banners.po';

export default class DeactivateDriverDialogPo extends ComponentPo {
  constructor() {
    super(cy.getId('prompt-deactivate'));
  }

  errorBannerContent(label: string): Cypress.Chainable {
    return new BannersPo('[data-testid="deactivate-driver-error-banner"]', this.self()).banner().contains(label);
  }

  deactivate() {
    return cy.getId('deactivate-driver-confirm').click();
  }

  cancel() {
    return cy.get('.role-secondary').click();
  }
}
