import ComponentPo from '@/cypress/e2e/po/components/component.po';
import AsyncButtonPo from '@/cypress/e2e/po/components/async-button.po';
import LabeledSelectPo from '@/cypress/e2e/po/components/labeled-select.po';

export default class AssignToDialogPo extends ComponentPo {
  constructor(selector = '[data-testid="card"]') {
    super(selector);
  }

  workspaceSelect(): LabeledSelectPo {
    return new LabeledSelectPo('[data-testid="workspace_options"]');
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
