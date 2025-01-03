import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class PromptRemove extends ComponentPo {
  constructor() {
    super(cy.get('[data-testid="card"].prompt-remove'));
  }

  confirmField() {
    return new LabeledInputPo(this.self().get('#confirm'));
  }

  confirm(text: string) {
    return this.confirmField().set(text);
  }

  remove() {
    return this.self().getId('prompt-remove-confirm-button').click();
  }

  deactivate() {
    return this.self().getId('prompt-remove-confirm-button').click();
  }

  cancel() {
    return this.self().get('.btn.role-secondary').click();
  }

  // Get the warning message
  warning() {
    return this.self().get('.card-body .text-warning');
  }
}
