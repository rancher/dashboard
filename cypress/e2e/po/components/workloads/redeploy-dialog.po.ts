import ComponentPo from '@/cypress/e2e/po/components/component.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';

export default class RedeployDialogPo extends ComponentPo {
  constructor(selector = '#modal-container-element') {
    super(selector);
  }

  shouldBeVisible(): this {
    this.self().should('be.visible');

    return this;
  }

  shouldBeClosed(): this {
    this.self().should('not.exist');

    return this;
  }

  cancel(): this {
    this.cancelButton().click();

    return this;
  }

  private cancelButton(): Cypress.Chainable {
    return this.self().find('button').contains(/cancel/i);
  }

  expectCancelButtonLabel(expectedText: string): this {
    this.cancelButton().should('contain.text', expectedText);

    return this;
  }

  private applyButton(): AsyncButtonPo {
    return new AsyncButtonPo('[data-testid="action-button-async-button"]', this.self());
  }

  expectApplyButtonLabel(expectedText: string): this {
    this.applyButton().self().should('contain.text', expectedText);

    return this;
  }

  confirmRedeploy(endpoint: string): void {
    const alias = 'redeploySuccess';

    cy.intercept('PUT', endpoint, { statusCode: 200 }).as(alias);

    this.applyButton().click();
    cy.wait(`@${ alias }`).its('response.statusCode').should('eq', 200);
  }

  simulateRedeployError(endpoint: string): void {
    const alias = 'redeployError';

    cy.intercept('PUT', endpoint, {
      statusCode: 500,
      body:       { message: 'Simulated failure' },
    }).as(alias);

    this.applyButton().click();
    cy.wait(`@${ alias }`);
    cy.get('[data-testid="banner-content"]').should('be.visible');
  }
}
