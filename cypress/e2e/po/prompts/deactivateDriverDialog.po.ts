import ComponentPo from '@/cypress/e2e/po/components/component.po';

export default class DeactivateDriverDialogPo extends ComponentPo {
  constructor() {
    super(cy.getId('prompt-deactivate'));
  }

  deactivate() {
    return cy.getId('deactivate-driver-confirm').click();
  }
}
