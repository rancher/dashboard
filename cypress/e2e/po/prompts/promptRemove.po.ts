import ComponentPo from '@/cypress/e2e/po/components/component.po';
import LabeledInputPo from '@/cypress/e2e/po/components/labeled-input.po';

export default class PromptRemove extends ComponentPo {
  constructor() {
    super(cy.get('body > #modals > .vue-portal-target > .modal-overlay > .remove-modal'));
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
}
